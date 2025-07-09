const clickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = function(event) {
      // Check if the click was outside the element and its children
      if (!(el === event.target || el.contains(event.target))) {
        // Call the provided method
        binding.value(event);
      }
    };
    document.addEventListener('click', el.clickOutsideEvent);
  },
  unmounted(el) {
    // Clean up the event listener when the element is removed
    document.removeEventListener('click', el.clickOutsideEvent);
  },
};

export default clickOutside;
