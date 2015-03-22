'use strict';

var elems = document.querySelectorAll('.codemirror');
for (var i = 0; i < elems.length; i++) {
	var editor = CodeMirror(function(cm_el) {
			elems[i].parentNode.replaceChild(cm_el, elems[i]);
		},
		{
			value: elems[i].value,
			mode: 'javascript',
				json: true,
			theme: 'monokai',
			//- lineNumbers: true,
			styleActiveLine: true
		}
	);
	//- console.log(editor.getValue());
}


function run_task(name) {
	$.post('/run/'+name, {}, function(res) {
		console.log(res.ok);
	});
}
