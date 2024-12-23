export const formIdCssMapping = {
  '/content/forms/af/hdfc_haf/cards/corporatecreditcard/uat/hdfc': '../../../creditcards/corporate-creditcard/cc-functions.js', // cc
  '/content/forms/af/hdfc_haf/digital/etb-fixed-deposit-cc': '../../../../../styles/fd-styles.css', // fd
  '/content/forms/af/hdfc_haf/cards/semi/forms/semi': '../../../../../../../styles/semi-styles.css',
  '/content/forms/af/hdfc_haf/loan-against-assets/smart-emi/smartemi': '../../../../../../../styles/semi-styles.css', // semi
};
export default function loadCSS(id) {
  if (id) {
    const cssPath = formIdCssMapping[atob(id)];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = cssPath;
    document.head.appendChild(link);
  }
}
