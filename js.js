window.onload = initializer;

function initializer(){
    main.init();
}

var main = {
    po: Object,
    init: function(){
        this.po = new moveable("pinky");
        this.po.update();
    },
}

/* Cypress's Generic Helpful Library */
function addEvent(element, eventName, callback) {
    if( element == null ) { return; }
    if( element.addEventListener ) {
        element.addEventListener(eventName,callback,false);
    }
    else if( element.attachEvent ) {
        element.attachEvent("on" + eventName, callback);
    }
}
function removeEvent(element, eventName, callback) {
    if(element == null) { return; }
    if(element.removeEventListener) {
        element.removeEventListener(eventName, callback, false);
    }
    else if(element.detachEvent) {
        element.detachEvent("on" + eventName, callback);
    }
}

/* moveable */
function moveable(element){
    console.log("creating moveable: " + element);
    that = this;
    this.element = document.getElementById(element);
    this.position = [100,100];
    this.size = [100,100];
    this.maxposition = [10000, 10000];
    this.minposition = [-10000, -10000];
    this.maxsize = [20000, 30000];
    this.minsize = [20, 20];
    this.handles = [];
    this.createHandles();
    addEvent(this.element, "mousedown", this.beginMove);
}

/* todo: right now, this creates each handle object based on
the html (UGLY AND BAD). I want to create the html based on the handle objects. */
moveable.prototype.createHandles = function() {
    var handles = this.element.getElementsByClassName("handle");
    var handle;
    var sides;
    for(var l = 0, k = handles.length; l < k; l++){
        handle = handles.item(l);
        sides = [];
        for(var i = 0, j = handle.classList.length; i < j; i++){
            var t = handle.classList[i];
            if(t ==="top" || t === "left" || t === "right" || t === "bottom"){
                sides = sides.concat(handle.classList[i]);
            }
        }
        this.handles = this.handles.concat(new resizer(handle,this,sides));
    }
};

moveable.prototype.resize = function(sizeChange, sides){
    this.size.add(sizeChange);
};

moveable.prototype.update = function(){
    this.element.style.width = this.size[0];
    this.element.style.height = this.size[1];
    this.element.style.left = this.position[0];
    this.element.style.top = this.position[1];
};

moveable.prototype.beginMove = function(event){
    document.lastChild.classList.toggle("grabbing");
    that.mouseDiff = [that.position[0] - event.pageX, that.position[1] - event.pageY];
    console.log("beginMove");
    addEvent(document, 'mousemove', that.move);
    addEvent(document, 'mouseup', that.endMove);
};

moveable.prototype.move = function(event){
    that.position = [event.pageX + that.mouseDiff[0], event.pageY + that.mouseDiff[1]];
    that.update();
};

moveable.prototype.endMove = function(event){
    console.log('endMove');
    document.lastChild.classList.toggle("grabbing");
    removeEvent(document, 'mousemove', that.move);
    removeEvent(document, 'mouseup', that.endMove);
};

moveable.prototype.setValue = function(possize, value, xy){
    if (value > this["max" + possize][xy]){value = this["max" + possize][xy];}
    if (value < this["min" + possize][xy]){value = this["min" + possize][xy];}
    this[possize][xy] = value;
};



/* handle */
function resizer(element, container, sides){
    var that = this;
    this.sides = sides;
    this.element = element;
    this.container = container;
    this.beginDrag = function(event){
        event.stopPropagation();
        that.mouseInit = [event.pageX, event.pageY];
        that.sizeInit = [that.container.size[0], that.container.size[1]];
        that.positionInit = [that.container.position[0], that.container.position[1]];
        addEvent(document, 'mousemove', that.drag);
        addEvent(document, 'mouseup', that.endDrag);
        console.log("begin drag");
    }
    
    this.drag = function(event){
        that.mouse = [event.pageX, event.pageY];
        for(var i in that.sides){
            that["drag" + that.sides[i]]();
            console.log(that.sides[i]);
        }
        that.container.update();
    }
    
    this.endDrag = function(event){
        removeEvent(document, 'mousemove', that.drag);
        removeEvent(document, 'mouseup', that.endDrag);
        console.log("end drag");
    }
    
    this.dragright = function(){
        that.container.setValue("size",that.mouse[0] - that.mouseInit[0] + that.sizeInit[0],0);
    }
    
    this.dragleft = function(){
        var test = that.container.setValue("size",-that.mouse[0] + that.mouseInit[0] + that.sizeInit[0],0);
        that.container.setValue("position",that.positionInit[0] - that.container.size[0] + that.sizeInit[0],0);
    }
    this.dragtop = function(){
        var test = that.container.setValue("size",that.sizeInit[1] + that.mouseInit[1] - that.mouse[1],1); 
        that.container.setValue("position",that.positionInit[1] - that.container.size[1] + that.sizeInit[1],1);
    }
    this.dragbottom = function(){
        that.container.setValue("size",that.mouse[1] - that.mouseInit[1] + that.sizeInit[1],1);
    }
    
    addEvent(this.element, "mousedown", this.beginDrag);
}