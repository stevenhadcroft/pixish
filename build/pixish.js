// Namespace
this.PIXI = this.PIXI || {};

(function() {

    "use strict";

    function PIXI(){

        var containerList = [];

        var ctx,
            canvas;

        var mouseDown,
            mouseDownX,
            mouseDownY;
        
        this.Application = function(w, h, options) {
            canvas          = document.createElement(navigator.isCocoonJS ? "screencanvas" : "canvas");
            ctx             = canvas.getContext('2d');
            canvas.width    = w;
            canvas.height   = h;
            if (options) {
                if (options.backgroundColor) {
                    canvas.style.backgroundColor = options.backgroundColor;
                }
            }

            if (PIXI.useTouch()) {
                document.addEventListener('touchstart', mouseDown);
                document.addEventListener('touchend', PIXI.domouseup);
                //document.addEventListener('touchmove', _this.dotouchmove);
            } else {
                canvas.onmousedown = function(e){
                    mouseDown(e);
                }
                canvas.onmouseup = function(e){
                    PIXI.mouseup(e);
                }
            }

            return {
                view        : canvas,
                stage       : new PIXI.Container(),
                ticker      : new PIXI.Ticker(),
                render      : PIXI.redraw
            }
        }

        this.Container = function() {
            var container = {
                type            : 'container',
                children        : [],
                addChild        : PIXI.addChild,
                removeChild     : PIXI.removeChild,
                removeAll       : PIXI.removeAll,
                x               : 0,
                y               : 0,
                position        : {x:0, y:0},
                scale           : {x:1, y:1},
                rotation        : 0,
                alpha           : 1,
                anchor          : new PIXI.Point(0, 0),
            }
            containerList.push(container);
            return container;
        };

        this.Sprite = function(texture) {
            return {
                type        : 'sprite',
                texture     : texture,
                x           : 0,
                y           : 0,
                position    : {x:0, y:0},
                scale       : {x:1, y:1},
                rotation    : 0,
                alpha       : 1,
                anchor      : new PIXI.Point(0, 0)
            }
        };

        this.useTouch = function () {
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        }

        this.mousedown = function (evt) {
            if (!evt) {
                evt = window.event;
            }
            mouseDown  = true;
            mouseDownX = PIXI.getMousePosition(evt).x*BD.SCALE;
            mouseDownY = PIXI.getMousePosition(evt).y*BD.SCALE;
            
            // log('------------------------------------')
            // log('BD.SCALE '+BD.SCALE)
            // log('mouseDownX '+mouseDownX)
            // log('mouseDownY '+mouseDownY)

            var children = PIXI.getChildrenAtCoord(mouseDownX, mouseDownY);
            for (var i in children){
                if (children[i].mousedown){
                    children[i].mousedown(children[i]);
                }
            }
        };

        this.mouseup = function (evt) {
            mouseDown  = true;
            PIXI.mouseUpX = PIXI.getMousePosition(evt).x*BD.SCALE;
            PIXI.mouseUpY = PIXI.getMousePosition(evt).y*BD.SCALE;
            var children = PIXI.getChildrenAtCoord(PIXI.mouseUpX, PIXI.mouseUpY);
            for (var i in children){
                if (children[i].mouseup){
                    children[i].mouseup(children[i]);
                }
            }
        }

        this.getChildrenAtCoord = function (x, y) {
            var arr = [];
            for (var c in containerList) {
                var container = containerList[c];
                for (var i in container.children) {
                    var child = container.children[i];
                    //var anchorX = child.anchor.x*container.anchor.x;
                    //var anchorY = child.anchor.y*container.anchor.y;
                    var anchorX = 0.5; //container.anchor.x;
                    var anchorY = 0.5; //container.anchor.y;
                    if (x > (child.___x - child.___w * anchorX) &&
                        x < (child.___x - child.___w * anchorX + child.___w) &&
                        y > (child.___y - child.___h * anchorY) &&
                        y < (child.___y - child.___h * anchorY + child.___h)
                    ) {
                        if (child.interactive) {
                            arr.push(child)
                        }
                        if (container.interactive) {
                            arr.push(container)
                        }
                    }
                }
            }
            return arr;
        };

        this.getMousePosition = function (evt) {
            var x;
            var y;
            if (PIXI.useTouch()) {
                x    = evt.targetTouches[0].clientX;
                y    = evt.targetTouches[0].clientY; // - $(window).scrollTop();
                return {
                    x: x,
                    y: y
                };
            } else {
                x    = (evt.clientX);
                y    = (evt.clientY);
                return {
                    x: x,
                    y: y
                }
            }
        };

        this.Texture = function(asset, bounds) {
            if (asset instanceof Image){
                asset.bounds = bounds;
                return asset;
            } else {
                var asset = PIXI.Texture.fromImage(asset);
                asset.bounds = bounds;
                return asset;
            }
        };

        this.Texture.fromImage =  function(url) {
            var img = new Image();
            img.src = url;
            return img;
        };
        
        this.Point = function(x, y) {
            return {
                type        : 'point',
                x           : x,
                y           : y
            }
        };

        this.Rectangle = function(x, y, w, h) {
            return {
                type        : 'rectangle',
                x           : x,
                y           : y,
                w           : w,
                h           : h
            }
        };

        this.Graphics = function() {
            return {
                type        : 'graphic',
                x           : 0,
                y           : 0,
                position    : {x:0, y:0},
                scale       : {x:1, y:1},
                rotation    : 0,
                alpha       : 1,
                anchor      : new PIXI.Point(0, 0),
                beginFill   : function(data){},
                drawRect    : function(data){},
                endFill     : function(data){},
            }
        };

        this.Text = function(txt, options) {
            return {
                type        : 'text',
                text        : txt,
                options     : options, //Object.assign({}, options),
                x           : 0,
                y           : 0,
                position    : {x:0, y:0},
                scale       : {x:1, y:1},
                rotation    : 0,
                alpha       : 1,
                anchor      : new PIXI.Point(0, 0),
            }
        };

        this.Ticker = function() {
            var tickerList = [];
            function tick() {
                for (var i in tickerList) {
                    //if function
                    tickerList[i]();
                }
                requestAnimationFrame(tick);
            }
            tick();
            return {
                add: function(f) {
                    tickerList.push(f)
                }
            }
        };

        this.addChild = function(o) {
            this.children.push(o);
            return o;
        }

        this.removeChild = function(o) {
            if (o.type = "container"){
                o.children = [];
            }
            this.children.splice(this.children.indexOf(o), 1);
        }

        this.removeAll = function() {
            this.children = [];
        }


        var TO_RADIANS = Math.PI/180;
        var TO_DEGREES = 180/Math.PI;

        this.redraw = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var c in containerList){
                var container = containerList[c];
                for (var i in container.children) {
                    var o = container.children[i];
                    if (container.children[i]){
                        var x = (o.x || o.position.x) + (container.x || container.position.x);
                        var y = (o.y || o.position.y) + (container.y || container.position.y);
                        var r = o.rotation + (container.rotation || 0)*TO_DEGREES;
                        var w = o.width || (o.texture ? o.texture.width : 0)
                            * (o.scale.x || 1)
                            * (container.scale.x || 1)
                            * (container.width ? container.width/(o.width || o.texture.width) : 1);

                        var h = o.height || (o.texture ? o.texture.height : 0)
                            * (o.scale.y || 1)
                            * (container.scale.y || 1)
                            * (container.height ? container.height/(o.height || o.texture.height) : 1);
                        var alpha = container.alpha * o.alpha;
                        o.___x = x;
                        o.___y = y;
                        o.___w = w;
                        o.___h = h;
                        if (o.type == "sprite") {
                            if (o.texture) {
                                PIXI.drawRotatedImage(o, x, y, w, h, r, alpha);
                            }
                        } else if (o.type == "text") {
                            ctx.font = o.options.font; //
                            ctx.fillStyle = o.options.fill || "grey";
                            ctx.textAlign = o.options.align || "left";
                            ctx.textAlign = "center";
                            ctx.fillText(o.text, x, y);
                        }
                    }
                }
            }
        };

        this.drawRotatedImage = function(obj, x, y, w, h, angle, alpha){
            if (obj.texture && w && h){
                ctx.save();
                ctx.globalAlpha = alpha;
                if (obj.texture.bounds){
                    var bounds = obj.texture.bounds;
                    ctx.translate(x, y);
                    ctx.rotate(angle * TO_RADIANS);
                    ctx.drawImage(  obj.texture,
                        bounds.x, bounds.y, bounds.w, bounds.h,
                        -bounds.w*obj.anchor.x, -bounds.h*obj.anchor.y, bounds.w, bounds.h);
                } else {
                    ctx.translate(x, y);
                    ctx.rotate(angle * TO_RADIANS);
                    ctx.drawImage(obj.texture, -w*obj.anchor.x, -h*obj.anchor.y, w, h);
                }
                ctx.restore();
            }
        };

        // ----------------------------
        // ----- LOADER ---------------
        // ----------------------------
        var loadarr = [];
        var onProgress;
        var onComplete;
        
        var loadSingle = function (){
            var d = loadarr.pop();
            this[d.name] = new Image();
            this[d.name].onload = function(evt) {
                if (loadarr.length>0){
                    onProgress({progress:loadarr.length}); // needs progress
                    loadSingle();
                } else {
                    onComplete(evt);
                }
            };
            this[d.name].onerror = function(evt) {
                if (loadarr.length>0){
                    onProgress(evt); // needs progress
                    loadSingle();
                } else {
                    onComplete(evt);
                }
            };
            this[d.name].src = d.url;
        };

        this.loader = {
            add: function(name, url) {
                loadarr.push({name:name, url:url})
            },
            on: function(name, fnct) {
                onProgress = fnct;
            },
            once: function(name, fnct) {
                onComplete = fnct;
            },
            load: function(name, fnct) {
                loadSingle();
            }
        };
        
    }
    
    BD.PIXI = PIXI();

}());



