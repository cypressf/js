/*
TODO:
-organize the giant closure and return pointers to any methods and variables that should be public

-look at compatibility
--addEventListener --> attachEvent
--if neither addEventListener or attachEvent exist, element.onevent = function
--is stopPropagation the best way to do it? I see {window.event.cancelBubble = true; window.event.returnValue false} or {event.stopPropagation(); event.preventDefault()}

-simplify and trim! goal: cut out 40 lines of code
--posibility: resizer object does not need to exist
--trim css styles (goal: cut 10 lines of code)

-make more useable!
--when creating a block, drag any which way, not only tl to br
--make delete buttons smaller-looking but with the same padding to click on

-start implementing server side stuff
--timeline
--save selections
--user account
*/


var closure = function(){
    var debug = true;
    var num = 0;
    var moveables = [];
    
    /* todo: only run init when the document is ready */
    init();
    
    function write(string) {
        if(debug) { console.log(string); }
    }
    function addEvent(element, eventName, callback) {
        if( element === null ) { return "no such element"; }
        if( element.addEventListener ) {
            element.addEventListener(eventName,callback,false);
            return "added callback " + callback + " to event " + eventName;
        }
        else if( element.attachEvent ) {
            element.attachEvent("on" + eventName, callback);
            return "added callback " + callback + " to event " + eventName + " (IE sucks, by the way)";
        }
    }
    function removeEvent(element, eventName, callback) {
        if(element === null) { return; }
        if(element.removeEventListener) {
            element.removeEventListener(eventName, callback, false);
        }
        else if(element.detachEvent) {
            element.detachEvent("on" + eventName, callback);
        }
    }
    function makeElement(type, id, classes, parent) {
        var element = document.createElement(type);
        element.id = id;
        for(var i in classes){
            element.classList.add(classes[i]);
        }
        parent.appendChild(element);
        return element;
    }
    function newMoveable(event){
        moveables = moveables.concat(new moveable("moveable" + num,[event.pageX-20,event.pageY-20],[0,0]));
        var handle = moveables[num].handles[6];
        moveables[num].update();
        handle.mouseInit = [event.pageX, event.pageY];
        handle.sizeInit = [handle.container.size[0], handle.container.size[1]];
        handle.positionInit = [handle.container.position[0], handle.container.position[1]];
        moveables[num].deleter.classList.add("hidden");
        document.body.classList.add("bottom");
        document.body.classList.add("right");
        addEvent(document, "mousemove", resizeMoveable);
        addEvent(document, "mouseup", endNewMoveable);
    }
    function endNewMoveable(event){
        moveables[num].deleter.classList.remove("hidden");
        document.body.classList.remove("bottom");
        document.body.classList.remove("right");
        removeEvent(document, "mousemove", resizeMoveable);
        removeEvent(document, "mouseup", endNewMoveable);
        num += 1;
    }
    function resizeMoveable(event){
        moveables[num].handles[6].drag(event);
    }
    function removeMoveable(moveable){
        write("moveable" + moveable.id + " was removed");
        document.body.removeChild(moveable.element);
        moveables.pop(moveable);
        num -= 1;
    }
    
    /* moveable */
    function moveable(id,position,size){
        write("creating moveable: " + id);
        this.id = id;
        var that = this;
        this.element = makeElement("div",id,["block"],document.body);
        this.position = position;
        this.size = size;
        this.maxposition = [10000, 10000];
        this.minposition = [-10000, -10000];
        this.maxsize = [20000, 30000];
        this.minsize = [20, 20];
        for (var i = 0; i < 2; i ++){
            if(size[i] > this.maxsize[i]){
                this.size[i] = this.maxsize[i];
            }
            if(size[i] < this.minsize[i]){
                this.size[i] = this.minsize[i];
            }
            if(position[i] > this.maxposition[i]){
                this.position[i] = this.maxposition[i];
            }
            if(position[i] < this.minposition[i]){
                this.position[i] = this.minposition[i];
            }
        }
        this.handles = [];
        var deleteLink = document.createElement("a");
        this.deleter = this.element.appendChild(deleteLink);
        this.deleter.innerHTML = "x";
        this.deleter.setAttribute("href","#delete" + id);
        this.deleter.draggable = false;


    this.createHandles = function() {
        var sides = {"top":["top"],"right":["right"],"bottom":["bottom"],"left":["left"],"tr":["top", "right"],"tl":["top", "left"],"br":["bottom", "right"],"bl":["bottom", "left"]};
        for(var i in sides){
            this.handles = this.handles.concat(new resizer(this, sides[i], i));
        }
    };
        this.createHandles();


        this.resize = function(sizeChange, sides){
            this.size.add(sizeChange);
        };

        this.update = function(){
            this.element.style.width = this.size[0];
            this.element.style.height = this.size[1];
            this.element.style.left = this.position[0];
            this.element.style.top = this.position[1];
        };

        this.beginMove = function(event){
            event.stopPropagation();
            document.body.classList.add("grabbing");
            that.mouseDiff = [that.position[0] - event.pageX, that.position[1] - event.pageY];
            write("beginMove");
            addEvent(document, 'mousemove', that.move);
            addEvent(document, 'mouseup', that.endMove);
        };

        this.move = function(event){
            that.position = [event.pageX + that.mouseDiff[0], event.pageY + that.mouseDiff[1]];
            that.update();
        };

        this.endMove = function(event){
            write('endMove');
            document.body.classList.remove("grabbing");
            removeEvent(document, 'mousemove', that.move);
            removeEvent(document, 'mouseup', that.endMove);
        };

        this.setValue = function(possize, value, xy){
            if (value > this["max" + possize][xy]){value = this["max" + possize][xy];}
            if (value < this["min" + possize][xy]){value = this["min" + possize][xy];}
            this[possize][xy] = value;
        };

        this.startRemove = function(event){
            write("starting remove");
            event.stopPropagation();
            addEvent(document, 'mouseup', that.cancelRemove);
            addEvent(that.deleter, 'mouseup', that.remove);
        };

        this.remove = function(event){
            removeMoveable(that);
            removeEvent(document, "mouseup", that.cancelRemove);
            removeEvent(that.deleter, "mouseup", that.remove);        
        };

        this.cancelRemove = function(event){
            write('remove canceled');
            removeEvent(document, "mouseup", that.cancelRemove);
            removeEvent(that.deleter, "mouseup", that.remove);
        };

        addEvent(this.element, "mousedown", this.beginMove);
        addEvent(this.deleter, "mousedown", this.startRemove);
    }

    /* resizer */
    function resizer(container, sides, id){
        var that = this;
        this.sides = sides;
        this.element = makeElement("div",id,sides,container.element);
        this.container = container;
        this.beginDrag = function(event){
            event.stopPropagation();
            that.mouseInit = [event.pageX, event.pageY];
            that.sizeInit = [that.container.size[0], that.container.size[1]];
            that.positionInit = [that.container.position[0], that.container.position[1]];
            addEvent(document, 'mousemove', that.drag);
            addEvent(document, 'mouseup', that.endDrag);
            for(var i in that.sides){
                document.body.classList.add(that.sides[i]);
            }
            write("begin drag");
        };

        this.drag = function(event){
            that.mouse = [event.pageX, event.pageY];
            for(var i in that.sides){
                that["drag" + that.sides[i]]();
            }
            that.container.update();
        };

        this.endDrag = function(event){
            removeEvent(document, 'mousemove', that.drag);
            removeEvent(document, 'mouseup', that.endDrag);
            for(var i in that.sides){
                document.body.classList.remove(that.sides[i]);
            }
            write("end drag");
        };

        this.dragright = function(){
            that.container.setValue("size",that.mouse[0] - that.mouseInit[0] + that.sizeInit[0],0);
        };

        this.dragleft = function(){
            var test = that.container.setValue("size",-that.mouse[0] + that.mouseInit[0] + that.sizeInit[0],0);
            that.container.setValue("position",that.positionInit[0] - that.container.size[0] + that.sizeInit[0],0);
        };

        this.dragtop = function(){
            var test = that.container.setValue("size",that.sizeInit[1] + that.mouseInit[1] - that.mouse[1],1); 
            that.container.setValue("position",that.positionInit[1] - that.container.size[1] + that.sizeInit[1],1);
        };

        this.dragbottom = function(){
            that.container.setValue("size",that.mouse[1] - that.mouseInit[1] + that.sizeInit[1],1);
        };

        addEvent(this.element, "mousedown", this.beginDrag);
    }
    
    function init(){
        write("starting");
        write(addEvent(document,"mousedown",newMoveable));
    }
    
    /* todo: return pointers to public methods or variables */
    return {};
}();