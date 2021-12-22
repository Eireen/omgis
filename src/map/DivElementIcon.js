/*
 * Вариация L.DivIcon, позволяющая задавать в `content` элементы,
 * которые будут использованы в качестве содержимого иконки
 */

import L from 'leaflet';

const parent_createIcon = L.DivIcon.prototype.createIcon;

L.DivElementIcon = L.DivIcon.extend({

	options: {
		// Ссылка на DOM-элемент
		innerElements: false
	},

	createIcon: function (oldIcon) {
		const { innerElements } = this.options;

		return innerElements !== false && innerElements.length
			? this._createIconFromElement(oldIcon)
			: parent_createIcon.apply(this, arguments);
	},

	_createIconFromElement: function (oldIcon) {
		var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div'),
		    options = this.options;

		for (let elem of options.innerElements) {
			if (elem) div.appendChild(elem);
		}

		if (options.bgPos) {
			var bgPos = L.point(options.bgPos);
			div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
		}
		this._setIconStyles(div, 'icon');

		return div;
	}
});

L.divElementIcon = function(options) {
	return new L.DivElementIcon(options);
};
