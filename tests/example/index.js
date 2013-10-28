var document = window.document;

function foo() {
    document.querySelector('.hello').innerText = 'Hello World!';
}

module.exports = foo;
