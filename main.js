//init after DOM loaded
// let sdf = document.body.querySelector("*[data-bindings");
// console.log(sdf);
let cb = new JsDataBindings("#container2");


// cb.indexDomElement(document.head);
// cb.indexDomElement("#container2");
if (true){
    let iterations = 10000;
    for (let i = 0; i < 10; i++){
        let el1 = document.getElementById("daws1");
        let el2 = document.getElementById("daws2");
        let el3 = document.getElementById("daws3");
        let start = performance.now();
        for (let i = 0; i < iterations; i++) {
            el1.value = i;
            el2.value = i;
            el3.value = i;
        }
        let end = performance.now();
        let domTime = (end-start);
        console.log(iterations + "x : " + domTime.toFixed(4) + " ms");




        cb.setFormatter(el1, "firstname", function (str) {
            return str + "-2";
        });

        start = performance.now();
        for (let i = 0; i < iterations; i++) {
            cb.firstname = i;
        }
        end = performance.now();
        let dbTime = (end-start);
        console.log(iterations + "x : " + dbTime.toFixed(4) + " ms");

        console.log((((dbTime - domTime) / domTime) * 100).toFixed(1) + "% "+ (dbTime<domTime ? "faster" : "slower") + " than DOM\n");
    }
}
