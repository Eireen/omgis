import $ from 'jquery';

export default $.fn.isolatedScroll = function() {
    this.on('mousewheel DOMMouseScroll touchmove', function (e) {
        var delta = e.wheelDelta || (e.originalEvent && e.originalEvent.wheelDelta) || -e.originalEvent.detail,
            bottomOverflow = (this.scrollTop + $(this).outerHeight() - this.scrollHeight) >= 0,
            topOverflow = this.scrollTop <= 0;

        if ((delta < 0 && bottomOverflow) || (delta > 0 && topOverflow)) {
            e.preventDefault();
        }
    });
    return this;
};
