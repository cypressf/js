/*
TODO:
-organize the giant closure and return pointers to any methods and variables that should be public

-look at compatibility
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
    var moveables = [];
    
    /* todo: make addClass and removeClass compatible in all browsers
    right now they only work in browsers that support classList */
    Element.prototype.addClass = function(classname){
        this.classList.add(classname);
    };
    Element.prototype.removeClass = function(classname){
        this.classList.remove(classname);
    };
    Node.prototype.addListener = function(eventType, listener, useCapture){
        write("adding a listener to " + this + "." + eventType);
        if( this.addEventListener ) { /* modern browser */
            this.addEventListener(eventType, listener, useCapture);
        }
        else if( element.attachEvent ) { /* ie */
            this.attachEvent("on" + eventType, listener);
        }
        else { /* old browser */
            this["on" + eventType] = listener;
        }
    };
    Node.prototype.removeListener = function(eventType, listener, useCapture){
        write("removing a listener from " + this + "." + eventType);
        if(this.removeEventListener) {
            this.removeEventListener(eventType, listener, useCapture);
        }
        else if(element.detachEvent) {
            this.detachEvent("on" + eventType, listener);
        }
        /* todo: is there another case where the browser doesn't
            support detachEvent? */
    };
    function write(string) {
        if(debug) { console.log(string); }
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
    
    /* todo: UX: make it so you can drag from one side to the other in a different direction*/
    function newMoveable(event){
        var position = [event.pageX-20,event.pageY-20];
        var size = [0,0];
        var mv = new moveable(position, size);
        moveables = moveables.concat( mv );
        var handle = mv.handles[6];
        mv.update();
        handle.mouseInit = [event.pageX, event.pageY];
        handle.sizeInit = [handle.container.size[0], handle.container.size[1]];
        handle.positionInit = [handle.container.position[0], handle.container.position[1]];
        
        mv.deleter.addClass("hidden");
        document.body.addClass("bottom");
        document.body.addClass("right");
        
        document.addListener("mousemove", resizeMoveable, false);
        document.addListener("mouseup", endNewMoveable, false);
        
        /*todo: there is a better way than to nest these functions
        inside newMoveable...*/
        function endNewMoveable(event){
            mv.deleter.removeClass("hidden");
            document.body.removeClass("bottom");
            document.body.removeClass("right");
            document.removeListener("mousemove", resizeMoveable, false);
            document.removeListener("mouseup", endNewMoveable, false);
            write("done creating");
        }
        
        function resizeMoveable(event){
            mv.handles[6].drag(event);
        }
    }


    function removeMoveable(moveable){
        write("moveable" + moveable.id + " was removed");
        document.body.removeChild(moveable.element);
        /* todo: make sure the element and the moveable object
        are deleted from memory. leaks are bad.*/
        moveable.element = null; // does this help?
        moveables.pop(moveable);
    }
    
    /* moveable */
    function moveable(position,size){
        this.id = moveables.length + 1;
        write("creating moveable: " + this.id);
        var that = this;
        this.element = makeElement("div",this.id,["block"],document.body);
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
        this.deleter.setAttribute("href","#delete" + this.id);


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
            write("updating");
            this.element.style.width = this.size[0] + "px";
            this.element.style.height = this.size[1] + "px";
            this.element.style.left = this.position[0] + "px";
            this.element.style.top = this.position[1] + "px";
        };

        this.beginMove = function(event){
            event.stopPropagation();
            document.body.classList.add("grabbing");
            that.mouseDiff = [that.position[0] - event.pageX, that.position[1] - event.pageY];
            write("beginMove");
            document.addListener('mousemove', that.move, false);
            document.addListener('mouseup', that.endMove, false);
        };

        this.move = function(event){
            that.position = [event.pageX + that.mouseDiff[0], event.pageY + that.mouseDiff[1]];
            that.update();
        };

        this.endMove = function(event){
            write('endMove');
            document.body.classList.remove("grabbing");
            document.removeListener('mousemove', that.move, false);
            document.removeListener('mouseup', that.endMove, false);
        };

        this.setValue = function(possize, value, xy){
            if (value > this["max" + possize][xy]){value = this["max" + possize][xy];}
            if (value < this["min" + possize][xy]){value = this["min" + possize][xy];}
            this[possize][xy] = value;
        };

        this.startRemove = function(event){
            write("starting remove");
            event.stopPropagation(); /*todo: this may not always work. fix the compatibility issue*/
            document.addListener('mouseup', that.cancelRemove, false);
            that.deleter.addListener('mouseup', that.remove, false);
        };

        this.remove = function(event){
            removeMoveable(that);
            document.removeListener('mouseup', that.cancelRemove, false);
            that.deleter.removeListener('mouseup', that.remove, false);        
        };

        this.cancelRemove = function(event){
            write('remove canceled');
            document.removeListener('mouseup', that.cancelRemove, false);
            that.deleter.removeListener('mouseup', that.remove, false);
        };

        this.element.addListener("mousedown", this.beginMove, false);
        this.deleter.addListener("mousedown", this.startRemove, false);
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
            document.addListener('mousemove', that.drag, false);
            document.addListener('mouseup', that.endDrag, false);
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
            document.removeListener('mousemove', that.drag, false);
            document.removeListener('mouseup', that.endDrag, false);
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

        this.element.addListener("mousedown", this.beginDrag, false);
    }
    
    function getMoveables(){
        return moveables;
    }
    
    function setDebug(bool){
        debug = bool;
    }
    
    function init(){
        write("starting");
        document.addListener("mousedown",newMoveable, false);
    }
    /* todo: only run init when the document is ready */
    init();
    /* todo: return pointers to public methods or variables */
    return {
        mv: getMoveables,
        debug: setDebug
    };
}();