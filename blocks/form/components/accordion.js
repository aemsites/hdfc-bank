/**
 * Represents a layout manager for creating accordion-style UI components.
 */
export class AccordionLayout {
  /**
   * Applies the accordion layout to the given panel.
   * @param {HTMLElement} panel - The panel element to which the accordion layout will be applied.
   */
  // eslint-disable-next-line class-methods-use-this
  applyLayout(panel) {
    if (panel) {
      panel.classList.add('accordion');
      Array.from(panel.children).forEach((child) => {
        if (child.tagName.toLowerCase() === 'fieldset') {
          const legend = child.querySelector('legend');
          if (legend) {
            legend.classList.add('hdfc-accordion-style');
            legend.addEventListener('click', () => {
              legend.classList.toggle('accordion-collapse');
              Array.from(child.children).forEach((childElement) => {
                if (childElement !== legend) {
                  childElement.style.display = (childElement.style.display === 'none') ? '' : 'none';
                }
              });
            });
          }
        }
      });
    }
  }
}

const layout = new AccordionLayout();

export default function accordionLayout(panel) {
  layout.applyLayout(panel);
  return panel;
}
