//? Library that demonstrates something throwing when it's init() is called
//container
let example = {};

//init functions
example.init = () => {
    //this is an error created intentionally(bar isnot defined)
    const foo = bar;
};

//explore the module
module.exports = example;
