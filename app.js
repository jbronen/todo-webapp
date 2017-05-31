/* module design pattern */
let TodoApp = (function() {

	// public object to be returned
	let app = {};

	// "cached" DOM variables
	let submitBox 		= document.getElementById("submitButton");
	let	todoList 		= document.getElementById("todoList");
	let	completedList 	= document.getElementById("completedList");
	let	taskInput 		= document.getElementById("taskInput");
	let	searchInput 	= document.getElementById("searchInput");

	// single public function
	app.init = function() {
		addEventListeners();
		appendTasksFromStorage();
	}

	// add event listeners to the DOM
	let addEventListeners = function() {
		submitBox.onclick = addTask;
		// nice to be able to press enter to add task
		taskInput.onkeyup = function(event) {
			event.preventDefault();
			if (event.keyCode == 13) {
				addTask(); 
			}
		}
		searchInput.oninput = filterCompleted;
		setTaskEvenListeners();
	}

	// get data from the storage module and load it into the app
	let appendTasksFromStorage = function() {
		let taskLists = StorageModule.loadFromStorage();
		let incompleteRE = /(\d*)\-incomplete/;
		let completeRE = /(\d*)\-complete/;

		taskLists.incompleteTasks.map(task => {
			let id = incompleteRE.exec(task.key)[1];
			let taskElement = createTodoTask(task.value, id, false);
			todoList.append(taskElement);
		});

		taskLists.completeTasks.map(task => {
			let id = completeRE.exec(task.key)[1];
			let taskElement = createTodoTask(task.value, id, true);
			completedList.append(taskElement);
		});
	}

	// we use event delegation for the incomplete task list
	let setTaskEvenListeners = function() {
		todoList.addEventListener('click',handler,false);
		function handler(e) {
			let element = e.target;
			if (element.nodeName.toLowerCase() === 'input') {
				markCompleted(element.parentNode);
				e.preventDefault();
			}
		};
	}

	// creates a task (an li element with a checkbox and label)
	// and appends to the incomplete list 
	let addTask = function() {
		let taskText = taskInput.value;
		taskInput.className = "";
		if (taskText !== "") {
			let id = StorageModule.pushNewTask(taskText);
			let newTodoTask = createTodoTask(taskText, id, false);
			todoList.appendChild(newTodoTask);
			taskInput.value = "";
		} else {
			// flash task input box red if empty
			taskInput.className += "err";
		}
	}

	// creates DOM object to be appended to do list
	let createTodoTask = function(taskText, id, completed) {
		let listElement = document.createElement("li");
		let checkBoxElement = document.createElement("input");
		let labelElement = document.createElement("label");
		listElement.id = id;
		listElement.className += " task";
		checkBoxElement.type = "checkbox";
		labelElement.innerText = taskText;
		listElement.appendChild(checkBoxElement);
		listElement.appendChild(labelElement);
		if (completed) {
			checkBoxElement.checked = true;
			checkBoxElement.className = "hidden";
		}
		return listElement;
	}

	// mark an item as completed
	let markCompleted = function(node) {
		StorageModule.markTaskCompleted(node.id, node.innerText);
		let checkbox = node.children[0];
		checkbox.checked = true;
		checkbox.className = "hidden";
		completedList.appendChild(node);
	}

	// handler for search to filter based on substring match
	let filterCompleted = function() {
		let searchText = searchInput.value;
		setCompletedClassNames("task");
		if (searchText !== "") {
			// get the list of indices of positive search results
			let resultIndices = Object.keys(completedList.children).filter(el => {
				if (completedList.children[el] !== undefined) {
					return completedList.children[el].innerText.toLowerCase()
						.includes(searchText.toLowerCase());
				}
			});
			// set all elements in complete task to hidden
			setCompletedClassNames("hidden");
			// and then set positive search result elements to task class
			resultIndices.map(idx => {
				completedList.children[idx].className = "task";
			});
		}
	}

	// helper function to set all li elements in completed list to a className
	let setCompletedClassNames = function(className) {
		let indices = Object.keys(completedList.children);
		indices.map(idx => {
			if (completedList.children[idx] !== undefined) {
				completedList.children[idx].className = className;
			}
		});
	}

	return app;

})();

// storage module, uses localStorage, falls back on sessionStorage
let StorageModule = (function() {
	let self = {};

	let storage;

	self.init = function() {
		if (!window.localStorage) {
			storage = sessionStorage;
		} else {
			storage = localStorage;
		}
		if (!storage.getItem("idCounter")) {
			storage.setItem("idCounter", 0);
		}
		self.loadFromStorage();
	}

	self.markTaskCompleted = function(taskId, taskDescription) {
		storage.removeItem(taskId+"-incomplete");
		storage.setItem(taskId+"-complete", taskDescription);
	}

	self.pushNewTask = function(task) {
		let idCounter = storage.getItem("idCounter");
		idCounter++;
		storage.setItem("idCounter", idCounter);
		storage.setItem(idCounter + "-incomplete", task);
		return idCounter;
	}

	self.loadFromStorage = function() {
		let incompleteTasks = [];
		let completeTasks = [];
		for (let i = 0; i < storage.length; i++) {
			let key = storage.key(i);
			if (key.includes("incomplete")) {
				incompleteTasks.push({key: key,
					value: storage.getItem(key)});
			} else if (key !== "idCounter") {
				completeTasks.push({key: key, value: storage.getItem(key)});
			}
		}
		return {completeTasks: 		completeTasks,
				incompleteTasks: 	incompleteTasks};
	}

	// not used yet, but there should be an easy button to clear everything from storage
	// might be nice to delete all incomplete, complete or individual items
	self.clearAll = function() {
		storage.clear();
		storage.setItem("idCounter", 0);
	}

	return self;

})();

StorageModule.init();
TodoApp.init();











