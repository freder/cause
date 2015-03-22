# 'cause

> an automation tool


---


## installation

requirements:
- [`node.js`](http://nodejs.org/)
- [`git`](http://git-scm.com/)

```shell
npm install
mv config.js.example config.js
```

then edit `config.js` and fill in the `XXXXXXXXX`s.


---


## run

```shell
node index.js
```

if you want to see [`debug`](https://www.npmjs.com/package/debug) messages:

```shell
DEBUG=-express:*,-send node index.js
```

or use [`nodemon`](http://nodemon.io/), [`forever`](https://github.com/foreverjs/forever), ...


---


## [`built-in blocks`](./blocks/)


---


## tasks

task configuration files live in `tasks/`. [`tasks/examples/`](./tasks/examples/) contains a few examples.

---


## examples

![](./task-example.png)


---


# writing your own blocks

is pretty straight-forward. — look at [`blocks/website-changed.js`](./blocks/website-changed.js) for a documented example.


---


## similar tools:
- [`ifttt`](https://ifttt.com/)
- [`huginn`](https://github.com/cantino/huginn)
- [`node-red`](http://nodered.org/)
- [`workflow`](https://workflow.is/)
