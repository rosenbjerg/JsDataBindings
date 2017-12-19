//init after DOM loaded
// let sdf = document.body.querySelector("*[data-bindings");
// console.log(sdf);
let cb = new JsDataBindings(document.getElementById("container"));

//
// document.getElementById("container").innerHTML += "<div data-bindings='firstname'></div>";
// document.getElementById("container").class = "test";
cb.firstname = "John Doe";
cb.onchanged(["x", "y"], () => cb.sum = cb.x * cb.y);
cb.onchanged("marked", (s,v) => console.log(v));
cb.click = () => alert("'click' binding");
// console.log(cb);



if (false){
    let cb2 = new JsDataBindings(document.getElementById("container2"));
    let iterations = 50000;
    for (let i = 0; i < 7; i++){
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
        console.log("Native DOM: \t" + iterations + " iterations in " + domTime.toFixed(4) + " ms");

        start = performance.now();
        for (let i = 0; i < iterations; i++) {
            cb2.firstname = i;
        }
        end = performance.now();
        let dbTime = (end-start);
        console.log("JsDataBindings: " + iterations + " iterations in " + dbTime.toFixed(4) + " ms");

        console.log(Math.abs((((dbTime - domTime) / domTime) * 100)).toFixed(1) + "% "+ (dbTime<domTime ? "faster" : "slower") + " than Native DOM\n\n");
    }
}
