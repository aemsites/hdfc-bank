export class AccordionLayout {
  // eslint-disable-next-line class-methods-use-this
  applyLayout(panel) {
    panel.classList.add('accordion');
    if (panel) {
      Array.from(panel.children).forEach((child) => {
        if (child.tagName.toLowerCase() === 'fieldset') {
          const legend = child.querySelector('legend');
          legend.classList.add('hdfc-accordion-style');
          if (legend) {
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
