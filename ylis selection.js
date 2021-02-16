// Variable for the starting point of selection rectangle during a selection
let startCoords;

// For throttling event listener execution
let select = false;
let lock = false;

// Get vp size
let vpSize = viewportSize();

// Arrays for visible thread elements (the only threads that could possibly be selected during a selection)
// and selected threads
let visibleThreads = [];
let selectedThreads = [];

// Init the app and store reference to the selection rectangle element
const rect = init();

function init() {

	window.addEventListener("mousedown", startSelection);
	window.addEventListener("mousemove", changeSelection);
	window.addEventListener("mouseup", finishSelection);

	window.addEventListener("click", e => {
		if(!e.shiftKey)
			return;
		e.preventDefault();
	});

	window.addEventListener("wheel", (e) => { 
		if(select) {
			e.preventDefault();
		}
	 }, {passive:false});

	window.addEventListener("resize", () => {
		vpSize = viewportSize();
	})

	return createSelectionRect();
}

function startSelection(e) {
	if(!e.shiftKey)
		return;

	e.preventDefault();

	console.log("startSelection")

	visibleThreads = getVisibleThreads();

	select = true;

	startCoords = getCursorCoords(e);

	rect.style.left = startCoords.left + "px";
	rect.style.right = "";
	rect.style.top = startCoords.top + "px";
	rect.style.bottom = "";
	rect.style.display = "block";	
}

function changeSelection(e) {
	if(!select || lock)
		return;

	console.log("changeSelection");

	e.preventDefault();

	const curCoords = getCursorCoords(e);

	const offsetX = curCoords.left - startCoords.left;
	const offsetY = curCoords.top - startCoords.top;

	window.requestAnimationFrame(() => {
		if(offsetX > 0) {
			rect.style.left = startCoords.left + "px";
			rect.style.right = curCoords.right + "px";
		}
		else {
			rect.style.left = curCoords.left + "px";
			rect.style.right = startCoords.right + "px";
		}

		if(offsetY > 0) {
			rect.style.top = startCoords.top + "px";
			rect.style.bottom = curCoords.bottom + "px";
		}
		else {
			rect.style.top = curCoords.top + "px";
			rect.style.bottom = startCoords.bottom + "px";
		}

		const rectPos = rect.getBoundingClientRect();

		for(let i = 0; i < visibleThreads.length; i++) {
			const thread = visibleThreads[i];
			const threadPos = thread.getBoundingClientRect();
			
			const doesContain = (rectPos.left - 120 < threadPos.left && rectPos.top - 250 < threadPos.top 
						&& rectPos.right + 120 > threadPos.right && rectPos.bottom + 250 > threadPos.bottom);

			const index = selectedThreads.indexOf(thread);
												
			if(doesContain && index == -1 && !thread.classList.contains("hidden")) {
				// selection highlight
				thread.style.backgroundColor = "red";
				selectedThreads.push(thread);
			}
			else if(!doesContain && index > -1) {
				// selection un-highlight 
				thread.style.backgroundColor = "";
				selectedThreads.splice(index, 1);
			}

		}
		lock = false;
	});
	lock = true;

}

function finishSelection(e) {
	if(!select)
		return;

	select = false;
	e.preventDefault();

	window.requestAnimationFrame(async () => {
		console.log("finish selection");
		
		rect.style.display = "none";

		for(let i = 0; i < selectedThreads.length; i++) {
			selectedThreads[i].style.backgroundColor = "";
			selectedThreads[i].getElementsByClassName("icon-minus")[0].click();
			await time(10);
		}
		selectedThreads = [];
	})

}

function createSelectionRect() {
	const rect = document.createElement("div");
	rect.style.position = "fixed";
	rect.style.border = "2px dashed #000";
	rect.style.display = "none";
	rect.style.zIndex = 500;
	rect.id = "selectionRect";
	document.body.appendChild(rect);
	return rect;
}

function getCursorCoords(e) {
	const left = e.clientX;
	const right = vpSize.x - left;
	const top = e.clientY;
	const bottom = vpSize.y - top;

	return {"left": left, "top": top, "right": right, "bottom": bottom};
}

function viewportSize() {
	const x = document.documentElement.clientWidth;
	const y = document.documentElement.clientHeight;
	return {"x": x, "y": y}
}

function getVisibleThreads() {
	const threadsCont = document.getElementsByClassName("board board-sekalainen")[0];
	const threads = [...threadsCont.getElementsByClassName("thread")];

	let firstThreadIndex = -1;
	let lastThreadIndex;
	for(let i = 0; i < threads.length; i++) {

		const pos = threads[i].getBoundingClientRect();

		if(pos.top > -170 && firstThreadIndex < 0) {
			firstThreadIndex = i;
		}

		if(vpSize.y - pos.top < 120) {
			lastThreadIndex = i;
			break;
		}
	}
	return threads.slice(firstThreadIndex, lastThreadIndex);
}

function time(ms) {
	return new Promise(resolve => setTimeout(resolve, ms) );
}