function hello() {
    var hello = document.createElement('div');
    hello.innerHTML = '<h1>Hello World!</h1>';
    hello.className = 'test';
    document.body.appendChild(hello);
}

module.exports = hello;