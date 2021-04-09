const timestamp = Date.now(); // This would be the timestamp you want to format
console.log(typeof timestamp)
//number

console.log(timestamp)
//1617940711587
//1617945656794


console.log(new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp));