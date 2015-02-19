# db
- tasks: {
	id: task,
	...
}

# task
- module
- name
- options: {
	- interval
	- ...
}
- data: {}

# module
- name
- pipeline: [building-block → building-block → building-block → building-block]
	+ stream-combiner

# module
- name
- through
- input: {
	name: type
}
- output: {
	name: type
}





# dir structure
./
	index.js
	config.js
	helpers.js
	lib/
		'atomic' building blocks, like 'request feed'
	modules/
		'workflows'
