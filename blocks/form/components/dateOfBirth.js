// eslint-disable-next-line no-unused-vars
export default async function decorate(fieldDiv, field, htmlForm) {
    let input = fieldDiv?.querySelector('input');
    input.addEventListener('keyup', (event) => {
        console.log(input.value);
        if(input.value){
            
            let dob = new Date(input.value);
         
            let age = getAge(dob);
            let year = dob.getFullYear();
            let dateInString = input.value.toString();
            let yearInString = year.toString();
            console.log(age);
            let yearInStringUnstripped = yearInString;
            yearInString = yearInString.replace(/^0+/, '');
            console.log("length"+yearInString.length);
            //input.value = dateInString;
               
            if((age < 0 || (age > 120 && yearInString.length === 4) || !(yearInString.startsWith('1') || yearInString.startsWith('2') || yearInString.startsWith('0')))){
                debugger;
                input.setAttribute('edit-value','Date of Birth');
                input.setAttribute('display-value', 'Date of Birth');
                input.value = 'Date of Birth';
                const event1 = new Event('change', {
                    bubbles: true, // Allow the event to bubble up
                    cancelable: true, // Allow the event to be canceled
                });
                input?.dispatchEvent(event1);
            }
        }
    });

    // input.addEventListener('change', (event) => {
    //     //console.log(input.value);
    //     if(input.value){
    //         let dateInString = input.value.toString();
    //         //dateInString = dateInString.replace(/^0+/, '');
    //         let yearString = dateInString.split('-')[0];
    //         yearString = yearString.replace(/^0+/, '');
    //         let count = 4 - yearString.length;
    //         for(let i=1; i<=count; i++){
    //             yearString = yearString+'0';
    //         }
    //         dateInString = yearString+'-'+dateInString.split('-')[1]+'-'+dateInString.split('-')[2];;
    //         console.log(dateInString);
            
    //             input.setAttribute('edit-value',dateInString);
    //             input.setAttribute('display-value', 'Date of Birth');
    //             input.value = dateInString;
    //             const event1 = new Event('change', {
    //                 bubbles: true, // Allow the event to bubble up
    //                 cancelable: true, // Allow the event to be canceled
    //             });
    //             input?.dispatchEvent(event1); 
            
    //     }
    // });
    return fieldDiv;

}

function getAge(d1, d2){
    d2 = d2 || new Date();
    var diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}