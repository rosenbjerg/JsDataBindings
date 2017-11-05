//init after DOM loaded
let cb = new JsDataBindings(document.getElementById("container"));
// cb.indexDomElement(document.head);

let el1 = document.getElementById("daws1");
let el2 = document.getElementById("daws2");
let el3 = document.getElementById("daws3");
let start = performance.now();
for (let i = 0; i < 10000; i++) {
    el1.value = i;
    el2.value = i;
    el3.value = i;
}
let end = performance.now();
console.log("10000x : " + (end-start).toFixed(4) + " ms");




cb.setFormatter(el1, "firstname", function (str) {
    return str + "-2";
});

start = performance.now();
for (let i = 0; i < 10000; i++) {
    cb.firstname(i);
}
end = performance.now();
console.log("10000x : " + (end-start).toFixed(4) + " ms");