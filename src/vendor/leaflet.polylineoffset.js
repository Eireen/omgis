import { clone } from '../utils/common';
import doLineSegmentsIntersect from './line-segments-intersect';

/* Eireen:
Вместо последней версии из NPM покдлючается этот более старый файл -
из пулреквеста https://github.com/bbecquet/Leaflet.PolylineOffset/pull/13/files,
т.к. последняя версия плагина с багом - "пузырями" на мелком масштабе */

L.PolylineOffset = {
  translatePoint: function(pt, dist, radians) {
    return L.point(pt.x + dist * Math.cos(radians), pt.y + dist * Math.sin(radians));
  },

  offsetPointLine: function(points, distance) {
    var l = points.length;
    if (l < 2) {
      throw new Error('Line should be defined by at least 2 points');
    }

    var a = points[0], b, xs ,ys, dist;
    var offsetAngle, segmentAngle;
    var offsetSegments = [];

    for(var i=1; i < l; i++) {
      b = points[i];
      xs = b.x - a.x;
      ys = b.y - a.y;
      dist = Math.sqrt(xs * xs + ys * ys);
      // angle in (-PI, PI]
      segmentAngle = Math.atan2(a.y - b.y, a.x - b.x);
      // angle in (-1.5 * PI, PI/2]
      offsetAngle = segmentAngle - Math.PI/2;

      // store offset point and other information to avoid recomputing it later
      offsetSegments.push({
        angle: segmentAngle,
        offsetAngle: offsetAngle,
        distance: distance,
        original: [a, b],
        offset: [
          this.translatePoint(a, distance, offsetAngle),
          this.translatePoint(b, distance, offsetAngle)
        ]
      });

      a = b;
    }

    return offsetSegments;
  },

  latLngsToPoints: function(ll, map) {
    var pts = [];
    for(var i=0, l=ll.length; i<l; i++) {
      pts[i] = map.project(ll[i]);
    }
    return pts;
  },

  pointsToLatLngs: function(pts, map) {
    var ll = [];
    for(var i=0, l=pts.length; i<l; i++) {
      ll[i] = map.unproject(pts[i]);
    }
    return ll;
  },

  offsetLatLngs: function(ll, offset, map) {
    var offsetPoints = this.offsetLatLngsToPoints(ll, offset, map);
    return this.pointsToLatLngs(offsetPoints, map);
  },

  offsetLatLngsToPoints: function(ll, offset, map) {
    var origPoints = this.latLngsToPoints(ll, map);
    return this.offsetPoints(origPoints, offset);
  },

  offsetPoints: function(pts, offset, prevPolyline, isStartPart, isEndPart, endPointOffset, fromPointOffset, reduceEnds, map) {
    // Если длина линии меньше общей ширины полос - не рисовать ее (некрасиво получится)
    if (pts.length > 1) {
      const minLength = 16; // от балды
      const isTooShortLine = pts[0].distanceTo(pts[pts.length - 1]) < minLength;
      if (isTooShortLine) return [];
    }

    this._map = map; // DEBUG !!!!!!!!

    this._sourcePoints = pts;
    this._distance = offset;

    var offsetSegments = this.offsetPointLine(pts, offset);
    var result = this.joinLineSegments(offsetSegments, offset, 'round');

    if (reduceEnds) {
      this.shortenLine(result, reduceEnds, 'start');
      this.shortenLine(result, reduceEnds, 'end');
    }

    if (prevPolyline) { // предыдущая нарисованная Polyline
      result = this.drawJunction(result, prevPolyline);

      // filter out NaN-results
      result = result.filter(point => !isNaN(point.x) && !isNaN(point.y));
      if (prevPolyline._rings && prevPolyline._rings[0]) {
        prevPolyline._rings[0] = prevPolyline._rings[0].filter(point => !isNaN(point.x) && !isNaN(point.y));
      }

      prevPolyline._update();
    }

    /* "Заворачивание" крайних сегментов в исходные точки */
    if ((isStartPart || isEndPart) && result.length) {
      const endTypes = { isStartPart, isEndPart };
      for (let endType in endTypes) {
        if (!endTypes[endType]) continue;

        const sourceEndSegment = endType === 'isStartPart'
          ? [ pts[1], pts[0] ]
          : [ pts[pts.length - 2], pts[pts.length - 1] ];
        //const sourcePoint = this.extendSegment(...sourceEndSegment, endPointOffset || 0);
        const sourcePoint = endType === 'isStartPart'
          ? pts[0]
          : pts[pts.length - 1];
        const offsetedPoint = endType === 'isStartPart'
          ? result[0]
          : result[result.length - 1];
        const endSegment = endType === 'isStartPart'
          ? [ result[1], result[0] ]
          : [ result[result.length - 2], result[result.length - 1] ];

        const bezierFromPoint = this.extendSegment(...endSegment, -(fromPointOffset || Math.abs(offset)));
        const bezierControlPoint1 = this.extendSegment(...endSegment, -(fromPointOffset || Math.abs(offset)) / 2);
        const bezierToPoint = sourcePoint;
        const bezierControlPoint2 = this.extendSegment(sourcePoint, offsetedPoint, -Math.abs(offset) / 2);

        /*L.circleMarker(this._map.layerPointToLatLng(offsetedPoint), {
            color: '#f00',
            fillColor: '#f00',
            fillOpacity: .5,
            radius: 5
        }).addTo(this._map);*/

        const joinResult = this.drawBezier(bezierFromPoint, bezierToPoint, bezierControlPoint1, bezierControlPoint2);

        if (endType === 'isStartPart') {
          result[0] = bezierFromPoint;
          result = joinResult.concat(result);
        } else {
          result[result.length - 1] = bezierFromPoint;
          result = result.concat(joinResult.reverse());
        }
      }
    }

    return result;
  },

  drawJunction(result, prevPolyline) { // Сопряжение с предыдущей линией
    var prevPoints = prevPolyline._rings[0];

    if (!prevPoints || prevPoints.length < 2 || result.length < 2) return result;

    if (this.cutLinesByIntersection(prevPoints, result)) {
      return result;
    }

    let prevLastPositions, currFirstPositions;
    let prevLastSegment, currFirstSegment;
    updateNeighbourSegments();

    /* Проверяем "неявные" пересечения - когда продолжение первого отрезка текущей линии пересекает предыдущую линию,
    или продолжение последнего отрезка предыдущей линии пересекает текущую.
    Такое пересечение может быть необязательно на крайнем сегментах; проверяются крайние 2 отрезка линии -
    т.к. проверка всех чревата нахождением "ложных" пересечений.
    При нахождении таковых связываем линии по ним */
    // Фиксит "шишку" на мелком масштабе у поворота "Москва-Углич"
    // UPD: временно отключено, т.к. срабатывает там, где не надо ("Белоомут шлюз из Москвы вниз")
    if (this.cutLineByIndirectIntersection(prevPoints, currFirstSegment, 'end')) {
      updateNeighbourSegments();
      result[currFirstPositions[0]] = prevLastSegment[1];
      return result;
    }
    if (this.cutLineByIndirectIntersection(result, prevLastSegment, 'start')) {
      updateNeighbourSegments();
      prevPoints[prevLastPositions[1]] = currFirstSegment[0];
      return result;
    }

    /* Укоротить концевые отрезков для возможности построения плавного перехода между сегментами */

    const shortenDistance = 20;
    const prevSegmentLength = prevLastSegment[0].distanceTo(prevLastSegment[1]);
    const currSegmentLength = currFirstSegment[0].distanceTo(currFirstSegment[1]);
    if (prevSegmentLength > shortenDistance) {
      const prevNewPoint = this.extendSegment(...prevLastSegment, -shortenDistance);
      prevLastSegment[1] = prevNewPoint;
      prevPoints[prevLastPositions[1]] = prevNewPoint;
    }
    if (currSegmentLength > shortenDistance) {
      const reversedCurrFirstSegment = clone(currFirstSegment).reverse().map(L.point);
      const currNewPoint = this.extendSegment(...reversedCurrFirstSegment, -shortenDistance);
      result[currFirstPositions[0]] = currNewPoint;
      currFirstSegment[0] = currNewPoint;
    }


    var joinResult = this.joinWithBezier(prevLastSegment, currFirstSegment);
    result = joinResult.reverse().concat(result);

    function updateNeighbourSegmentPointPositions(prevPoints, result) {
      // индексы точек последнего отрезка предыдущей линии
      let prevLastPositions = !prevPoints.length
        ? []
        : [
          prevPoints.length > 1 ? prevPoints.length - 2 : prevPoints.length - 1,
          prevPoints.length - 1
        ];
      // индексы точек первого отрезка текущей линии
      let currFirstPositions = !result.length
        ? []
        : [
          0,
          result.length > 1 ? 1 : 0
        ];

      return [ prevLastPositions, currFirstPositions ];
    }

    function updateNeighbourSegments() {
      [ prevLastPositions, currFirstPositions ] = updateNeighbourSegmentPointPositions(prevPoints, result);
      prevLastSegment = [ prevPoints[prevLastPositions[0]], prevPoints[prevLastPositions[1]] ];
      currFirstSegment = [ result[currFirstPositions[0]], result[currFirstPositions[1]] ];
    }

    return result;
  },

  extendSegment: function(A, B, distance) { // Удлиняет или укорачивает отрезок на заданную длину
    // Thanks to: https://stackoverflow.com/a/10163487/1780443
    const segmentLength = A.distanceTo(B);
    if (distance < 0 && segmentLength <= Math.abs(distance)) return A;
    const newB = L.point({
      x: B.x + (B.x - A.x) / segmentLength * distance,
      y: B.y + (B.y - A.y) / segmentLength * distance
    });
    return newB;
  },

  getBezierPoint: function(percent, p1, cp1, cp2, p2) {
    // Thanks to: http://www.iscriptdesign.com/?sketch=tutorial/splitbezier
    // (through https://stackoverflow.com/questions/8369488/splitting-a-bezier-curve/8405756 )
    function b1(t) { return t*t*t }
    function b2(t) { return 3*t*t*(1-t) }
    function b3(t) { return 3*t*(1-t)*(1-t) }
    function b4(t) { return (1-t)*(1-t)*(1-t) }
    return L.point({
      x: p1.x*b1(percent) + cp1.x*b2(percent) + cp2.x*b3(percent) + p2.x*b4(percent),
      y: p1.y*b1(percent) + cp1.y*b2(percent) + cp2.y*b3(percent) + p2.y*b4(percent)
    });
  },

  joinWithBezier(segment1, segment2, controlPointDist) {
    segment2 = clone(segment2).reverse().map(L.point);

    const segmentDist = segment1[1].distanceTo(segment2[1]);
    const stepDist = 2; // от балды

    if (segmentDist <= stepDist * 2) { // слишком мелкое расстояние
      return [ segment1[1] ];
    }

    if (!controlPointDist) controlPointDist = segmentDist / 2;
    const controlPoint1 = this.extendSegment(...segment1, controlPointDist);
    const controlPoint2 = this.extendSegment(...segment2, controlPointDist);

    const pointCount = Math.floor(segmentDist / stepDist);

    const resultPoints = [];
    for (let i = 1; i <= pointCount; i++) {
      const percent = stepDist * i / segmentDist;
      resultPoints.push(this.getBezierPoint(percent, segment1[1], controlPoint1, controlPoint2, segment2[1]));
    }
    // по логике нужно вставлять эту точку в начало массива, но работает именно так; TODO: разобраться
    // UPD: есть подозрение, что точки выдаются в порядке от 2-го сегмента к 1-му
    resultPoints.push(segment1[1]);

    return resultPoints;
  },

  drawBezier(point1, point2, controlPoint1, controlPoint2) {
    const dist = point1.distanceTo(point2);
    const stepDist = 2; // от балды

    if (dist <= stepDist * 2) { // слишком мелкое расстояние
      return [ point2 ];
    }

    const pointCount = Math.floor(dist / stepDist);

    const resultPoints = [];
    for (let i = 1; i <= pointCount; i++) {
      const percent = stepDist * i / dist;
      resultPoints.push(this.getBezierPoint(percent, point1, controlPoint1, controlPoint2, point2));
    }

    return resultPoints;
  },

  /* https://stackoverflow.com/a/6853926/1780443 */
  distToSegment(point, segmentStart, segmentEnd) {
    const { x, y } = point;
    const { x: x1, y: y1 } = segmentStart;
    const { x: x2, y: y2 } = segmentEnd;

    var A = x - x1;
    var B = y - y1;
    var C = x2 - x1;
    var D = y2 - y1;

    var dot = A * C + B * D;
    var len_sq = C * C + D * D;
    var param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    var xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    var dx = x - xx;
    var dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
  Return the intersection point of two lines defined by two points each
  Return null when there's no unique intersection
  */
  intersection: function(l1a, l1b, l2a, l2b) {
    var line1 = this.lineEquation(l1a, l1b),
        line2 = this.lineEquation(l2a, l2b);

    if (line1 == null || line2 == null) {
      return null;
    }

    if(line1.hasOwnProperty('x')) {
      if(line2.hasOwnProperty('x')) {
        return null;
      }
      return L.point(line1.x, line2.a * line1.x + line2.b);
    }
    if(line2.hasOwnProperty('x')) {
      return L.point(line2.x, line1.a * line2.x + line1.b);
    }

    if (line1.a == line2.a) {
      return null;
    }

    var x = (line2.b - line1.b) / (line1.a - line2.a),
        y = line1.a * x + line1.b;

    return L.point(x, y);
  },

  /**
  Find the coefficients (a,b) of a line of equation y = a.x + b,
  or the constant x for vertical lines
  Return null if there's no equation possible
  */
  lineEquation: function(pt1, pt2) {
    if (pt1.x != pt2.x) {
      var a = (pt2.y - pt1.y) / (pt2.x - pt1.x);
      return {
        a: a,
        b: pt1.y - a * pt1.x
      };
    }

    if (pt1.y != pt2.y) {
      return { x: pt1.x };
    }

    return null;
  },

  /**
  Join 2 line segments defined by 2 points each,
  with a specified methodnormalizeAngle( (default : intersection);
  */
  joinSegments: function(s1, s2, offset, joinStyle) {
    var jointPoints = [];
    switch(joinStyle) {
      case 'round':
        jointPoints = this.circularArc(s1, s2, offset);
        break;
      case 'cut':
        jointPoints = [
          this.intersection(s1.offset[0], s1.offset[1], s2.original[0], s2.original[1]),
          this.intersection(s1.original[0], s1.original[1], s2.offset[0], s2.offset[1])
        ];
        break;
      case 'straight':
        jointPoints = [s1.offset[1], s2.offset[0]];
        break;
      case 'intersection':
      default:
        jointPoints = [this.intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])];
    }
    // filter out null-results
    return jointPoints.filter(function(v) {return v;});
  },

  joinLineSegments: function(segments, offset, joinStyle) {
    var l = segments.length;
    var joinedPoints = [];
    var s1 = segments[0], s2 = segments[0];
    if (s1 && s2) {

      if (!this.tooCloseToBase(s1.offset[0])) {
        joinedPoints.push(s1.offset[0]);
      } else {
        // Относим точку на "безопасное" расстояние (выкидывать её нельзя)
        const newPoint = this.extendSegment(s1.offset[1], s1.offset[0], Math.abs(offset) - s1.offset[0]._tooCloseDist);
        joinedPoints.push(newPoint);
      }

      for(var i=1; i<l; i++) {
        s2 = segments[i];
        joinedPoints = joinedPoints.concat(this.joinSegments(s1, s2, offset, joinStyle));
        s1 = s2;
      }

      if (!this.tooCloseToBase(s2.offset[1])) {
        joinedPoints.push(s2.offset[1]);
      } else {
        // Относим точку на "безопасное" расстояние (выкидывать её нельзя)
        const newPoint = this.extendSegment(s2.offset[0], s2.offset[1], Math.abs(offset) - s2.offset[1]._tooCloseDist);
        joinedPoints.push(newPoint);
      }
    }

    return joinedPoints;
  },

  /**
  Interpolates points between two offset segments in a circular form
  */
  circularArc: function(s1, s2, distance) {
    if (s1.angle == s2.angle)
      return [s1.offset[1]];

    var center = s1.original[1];
    var points = [];

    if (distance < 0) {
      var startAngle = s1.offsetAngle;
      var endAngle = s2.offsetAngle;
    } else {
      // switch start and end angle when going right
      var startAngle = s2.offsetAngle;
      var endAngle = s1.offsetAngle;
    }

    if (endAngle < startAngle) {
      endAngle += Math.PI * 2; // the end angle should be bigger than the start angle
    }

    if (endAngle > startAngle + Math.PI) {
      if (doLineSegmentsIntersect(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])) {
        return [this.intersection(s1.offset[0], s1.offset[1], s2.offset[0], s2.offset[1])];
      }
      return [];
    }

    // Step is distance dependent. Bigger distance results in more steps to take
    var step = Math.abs(8/distance);
    for (var a = startAngle; a < endAngle; a += step) {
      const point = this.translatePoint(center, distance, a);
      if (!this.tooCloseToBase(point)) points.push(point);
    }

    const offsetedEndAngle = this.translatePoint(center, distance, endAngle);
    if (!this.tooCloseToBase(offsetedEndAngle)) points.push(offsetedEndAngle);

    if (distance > 0) {
      // reverse all points again when going right
      points.reverse();
    }

    return points;
  },

  tooCloseToBase(point) {
    let tooClose = false;
    for (let j = 0, l = this._sourcePoints.length; j < l - 1; j++) {
      let aa = this._sourcePoints[j];
      let bb = this._sourcePoints[j + 1];
      let dist = this.distToSegment(point, aa, bb);
      if (dist < Math.abs(this._distance) - 1) {
        tooClose = true;
        point._tooCloseDist = dist; // кэшируем для удобства
        break;
      }
    }
    return tooClose;
  },

  cutLinesByIntersection(line1, line2) { // возвращает true, если найдено пересечение
    for (let i = 0, l1 = line1.length; i < l1 - 1; i++) {
      const segment1 = [ line1[i], line1[i + 1] ];
      for (let j = 0, l2 = line2.length; j < l2 - 1; j++) {
        const segment2 = [ line2[j], line2[j + 1] ];
        const areIntersectingSegments = doLineSegmentsIntersect(...segment1, ...segment2);
        if (areIntersectingSegments) {
          const intersection = this.intersection(...segment1, ...segment2);
          if (!intersection) continue; // можеть возвращать null, например, для "вырожденных" отрезков (начало и конец совпадают)
          line1[i + 1] = intersection;
          line2[j] = intersection;
          line1.splice(i + 2);
          line2.splice(0, j);
          return true;
        }
      }
    }
    return false;
  },

  cutLineByIndirectIntersection(line, segment, direction = 'start') { // возвращает true, если найдено пересечение
    /* Проверяем "неявное" пересечение линии и сегмента и обрубаем линию по нему. */

    /* "Неявным" пересечением здесь названа ситуация, когда продолжение `segment` где-либо пересекает `line` -
    например, продолжение первого отрезка текущей отрисовываемой линии пересекает предыдущую линию,
    или продолжение последнего отрезка предыдущей линии пересекает текущую.
    Проверяются крайние `checkingSegmentCount` отрезков линии, т.к. перебор всей линии чреват нахождением "ложных" пересечений.

    NOTE: При checkingSegmentCount = 2 фиксит "шишку" на мелком масштабе у поворота "Москва-Углич",
    но установлено в 1, т.к. срабатывало там, где не надо (у маршрута "Белоомут шлюз из Москвы вниз" исчезала точка)
    TODO: разработать правило для checkingSegmentCount = 2, когда нужно проверять/удалять отрезки, когда нет */

    const checkingSegmentCount = 1; // сколько крайних сегментов линии проверять

    if (direction === 'start') {
      for (let i = 0, count = Math.min(checkingSegmentCount, line.length - 1); i < count; i++) {
        const lineSegment = [ line[i], line[i + 1] ];
        const intersection = this.intersection(...lineSegment, ...segment);
        if (!intersection) continue; // можеть возвращать null, например, для "вырожденных" отрезков (начало и конец совпадают)
        if (this.pointBelongsToSegment(intersection, lineSegment)) {
          line[i] = intersection;
          line.splice(0, i);
          return true;
        }
      }
    } else {
      for (let i = Math.max(0, line.length - checkingSegmentCount - 1), l1 = line.length; i < l1 - 1; i++) {
        const lineSegment = [ line[i], line[i + 1] ];
        const intersection = this.intersection(...lineSegment, ...segment);
        if (!intersection) continue; // можеть возвращать null, например, для "вырожденных" отрезков (начало и конец совпадают)
        if (this.pointBelongsToSegment(intersection, lineSegment)) {
          line[i + 1] = intersection;
          line.splice(i + 2);
          return true;
        }
      }
    }

    return false;
  },

  pointBelongsToSegment(point, segment) {
    let x1 = Math.min(segment[0].x, segment[1].x);
    let x2 = Math.max(segment[0].x, segment[1].x);
    let y1 = Math.min(segment[0].y, segment[1].y);
    let y2 = Math.max(segment[0].y, segment[1].y);
    return point.x >= x1 && point.x <= x2 && point.y >= y1 && point.y <= y2;
  },

  shortenLine(line, shortenDistance, direction) {
    let shortenedLength = 0;
    let remainingDistance = shortenDistance;
    let startPointIndex, endPointIndex;

    if (direction === 'start') {
      startPointIndex = 1;
      endPointIndex = 0;
    } else {
      startPointIndex = line.length - 2;
      endPointIndex = line.length - 1;
    }

    while (remainingDistance > 0 && line.length > 1) {
      const segmentLength = line[startPointIndex].distanceTo(line[endPointIndex]);
      if (!segmentLength) {
        remainingDistance = 0; // для выхода из цикла
        return;
      }
      if (segmentLength <= remainingDistance) {
        // Удаляем отрезок
        line.splice(endPointIndex, 1);
        remainingDistance -= segmentLength;
      } else {
        // Укорачиваем отрезок
        const newPoint = this.extendSegment(line[startPointIndex], line[endPointIndex], -remainingDistance);
        line[endPointIndex] = newPoint;
        remainingDistance = 0;
      }
    }
  }
}

// Modify the L.Polyline class by overwriting the projection function,
// to add offset related code
// Versions < 0.8
if(L.version.charAt(0) == '0' && parseInt(L.version.charAt(2)) < 8) {
  L.Polyline.include({
    projectLatlngs: function() {
      this._originalPoints = [];

      for (var i = 0, len = this._latlngs.length; i < len; i++) {
        this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
      }
      // Offset management hack ---
      if(this.options.offset) {
        this._originalPoints = L.PolylineOffset.offsetPoints(this._originalPoints, this.options.offset);
      }
      // Offset management hack END ---
    }
  });
} else {
// Versions >= 0.8
  L.Polyline.include({
    _projectLatlngs: function (latlngs, result, projectedBounds) {
      var flat = latlngs[0] instanceof L.LatLng,
          len = latlngs.length,
          i, ring;

      if (flat) {
        ring = [];
        for (i = 0; i < len; i++) {
          ring[i] = this._map.latLngToLayerPoint(latlngs[i]);
          if (projectedBounds !== undefined) {
            projectedBounds.extend(ring[i]);
          }
        }
        // Offset management hack ---
        if(this.options.offset) {
          ring = L.PolylineOffset.offsetPoints(ring, this.options.offset, this.options.offset_previousLine, this.options.offset_isStartPart, this.options.offset_isEndPart, this.options.offset_endPointOffset, this.options.offset_fromPointOffset, this.options.offset_reduceEnds, this._map);
        }
        // Offset management hack END ---
        result.push(ring);
      } else {
        for (i = 0; i < len; i++) {
          if (projectedBounds !== undefined) {
            this._projectLatlngs(latlngs[i], result, projectedBounds);
          } else {
            this._projectLatlngs(latlngs[i], result);
          }
        }
      }
    }
  });
}

L.Polyline.include({
  setOffset: function(offset) {
    this.options.offset = offset;
    this.redraw();
    return this;
  }
});
