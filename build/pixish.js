 // Namespace
this.BD = this.BD || {};
this.PIXI = this.PIXI || {};

(function() {

    "use strict";

    function P(){

        // ------------- vars -------------
        // needs : BASE_WIDTH, BD.canvasWidth, BD.SCALE
        var globalScale = BD ? BD.SCALE || 1 : 1;
        var containerList = [];
        var ctx,
            canvas;

        var mouseDown,
            mouseDownX,
            mouseDownY,
            mouseUpX,
            mouseUpY;

        // ------------- constants -------------
        var TO_RADIANS = Math.PI/180;
        var TO_DEGREES = 180/Math.PI;

        // ------------- constructors -------------
        var Application = function(w, h, options) {
            canvas          = document.createElement(navigator.isCocoonJS ? "screencanvas" : "canvas");
            ctx             = canvas.getContext('2d');
            canvas.width    = w;
            canvas.height   = h;
            if (options) {
                if (options.backgroundColor) {
                    canvas.style.backgroundColor = options.backgroundColor;
                }
            }

            if (useTouch()) {
                document.addEventListener('touchstart', onmousedown);
                document.addEventListener('touchend', onmouseup);
                //document.addEventListener('touchmove', _this.dotouchmove);
            } else {
                canvas.onmousedown = function(e){
                    onmousedown(e);
                }
                canvas.onmouseup = function(e){
                    onmouseup(e);
                }
            }

            return {
                view        : canvas,
                stage       : new Container(),
                ticker      : new Ticker(),
                render      : redraw
            }
        };

        var Container = function() {
            var container = Object.assign(genericObject(),{
                    type            : 'container',
                    children        : [],
                    addChild        : addChild,
                    removeChild     : removeChild,
                    removeAll       : removeAll,
                }
            );
            containerList.push(container);
            return container;
        };

        var Sprite = function(texture) {
            return Object.assign(genericObject(),{
                    type        : 'sprite',
                    texture     : texture,
                }
            );
        };

        var Texture = function(asset, bounds) {
            if (asset instanceof Image){
                asset.bounds = bounds;
                return asset;
            } else {
                var asset = Texture.fromImage(asset);
                asset.bounds = bounds;
                return asset;
            }
        };

        Texture.fromImage =  function(url) {
            var img = new Image();
            img.src = url;
            return img;
        };

        var Point = function(x, y) {
            return {
                type        : 'point',
                x           : x,
                y           : y
            }
        };

        var Rectangle = function(x, y, w, h) {
            return {
                type        : 'rectangle',
                x           : x,
                y           : y,
                w           : w,
                h           : h
            }
        };

        var Graphics = function() {
            return Object.assign(genericObject(),{
                    type        : 'graphic',
                    beginFill   : function(data){},
                    drawRect    : function(data){},
                    endFill     : function(data){}
                }
            );
        };

        var Text = function(txt, options) {
            return Object.assign(genericObject(),{
                    type        : 'text',
                    text        : txt,
                    options     : Object.assign({}, options),
                }
            );
        };

        var Ticker = function() {
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

        var addChild = function(o) {
            this.children.push(o);
            return o;
        }

        var removeChild = function(o) {
            if (o.type = "container"){
                o.children = [];
            }
            this.children.splice(this.children.indexOf(o), 1);
        }

        var removeAll = function() {
            this.children = [];
        }

        var onmousedown = function (evt) {
            if (!evt) {
                evt = window.event;
            }
            var p = getMousePosition(evt);
            mouseDownX = p.x;
            mouseDownY = p.y;
            mouseDown  = true;
            log('------------------------------------')
            log('mouseDownX '+mouseDownX)
            log('mouseDownY '+mouseDownY)
            var children = getChildrenAtCoord(mouseDownX, mouseDownY);
            for (var i in children){
                if (children[i].mousedown){
                    children[i].mousedown(children[i]);
                }
            }
        };

        var onmouseup = function (evt) {
            if (!evt) {
                evt = window.event;
            }
            var p = getMousePosition(evt);
            mouseUpX = p.x;
            mouseUpY = p.y;
            mouseDown  = true;
            var children = getChildrenAtCoord(mouseUpX, mouseUpY);
            for (var i in children){
                if (children[i].mouseup){
                    children[i].mouseup(children[i]);
                }
            }
        }

        var getChildrenAtCoord = function (x, y) {
            var arr = [];
            containerList.forEach(function(container){
                container.children.forEach(function(child){
                    var anchorX = child.anchor.x;
                    var anchorY = child.anchor.y;
                    if (x > (child.___x - child.___w * anchorX) &&
                        x < (child.___x - child.___w * anchorX + child.___w) &&
                        y > (child.___y - child.___h * anchorY) &&
                        y < (child.___y - child.___h * anchorY + child.___h)
                    ) {
                        if (child.interactive) {
                            arr = [child];
                        }
                        if (container.interactive) {
                            arr = [container];
                        }
                    }
                })
            })
            return arr;
        };

        var getMousePosition = function (evt) {
            var xsc = BASE_WIDTH/BD.canvasWidth;
            var ysc = BASE_HEIGHT/BD.canvasHeight;
            var x;
            var y;
            if (useTouch()) {
                x    = evt.targetTouches[0].clientX/globalScale*xsc;
                y    = evt.targetTouches[0].clientY/globalScale*ysc; // - $(window).scrollTop();
                return {
                    x: x,
                    y: y
                };
            } else {
                x    = (evt.clientX)/globalScale*xsc;
                y    = (evt.clientY)/globalScale*ysc;
                return {
                    x: x,
                    y: y
                }
            }
        };

        var redraw = function() {
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
                                drawRotatedImage(o, x, y, w, h, r, alpha);
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

        var drawRotatedImage = function(obj, x, y, w, h, angle, alpha){
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
            window[d.name] = new Image();
            window[d.name].onload = function(evt) {
                if (loadarr.length>0){
                    onProgress({progress:loadarr.length}); // needs progress
                    loadSingle();
                } else {
                    onComplete(evt);
                }
            };
            window[d.name].onerror = function(evt) {
                if (loadarr.length>0){
                    onProgress(evt); // needs progress
                    loadSingle();
                } else {
                    onComplete(evt);
                }
            };
            window[d.name].src = d.url;
        };

        var loader = {
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

        // ----------------------------
        // ----- HELPERS ---------------
        // ----------------------------
        var useTouch = function () {
            try {
                document.createEvent("TouchEvent");
                return true;
            } catch (e) {
                return false;
            }
        };

        var genericObject = function () {
            return {
                x           : 0,
                y           : 0,
                position    : {x:0, y:0},
                scale       : {x:1, y:1},
                rotation    : 0,
                alpha       : 1,
                anchor      : new Point(0, 0)
            }
        };

        // ----- PUBLIC ---------------
        this.Application    = Application;
        this.Container      = Container;
        this.Sprite         = Sprite;
        this.Texture        = Texture;
        this.Point          = Point;
        this.Rectangle      = Rectangle;
        this.Graphics       = Graphics;
        this.Text           = Text;
        this.Ticker         = Ticker;
        this.loader         = loader;

        this.addChild       = addChild;
        this.removeChild    = removeChild;
        this.removeAll      = removeAll;


        return this;
    }
    
    PIXI = new P();

}());



