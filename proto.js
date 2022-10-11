const fs = require('fs'); // Provides filesystem modification

jsonSequence = fs.readFileSync('configuration.json','utf-8')

console.log(jsonSequence)

bitSequence = ""

jsonSequence.forEach(obj => {
    Object.entries(obj).forEach(
        ([value]) => {
            console.log(value)
        }
    )
})


for (x in jsonSequence) {
    if (x === true) {
        console.log(x);
        bitSequence = bitSequence + "1";
        console.log(bitSequence)
    } else {
        bitSequence = bitSequence + "0";
        console.log(bitSequence)
    }
}


