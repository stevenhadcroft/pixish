 // Namespace
this.BD = this.BD || {};
this.PIXI = this.PIXI || {};

(function() {

    "use strict";

    function P(){

        // ------------- vars -------------
        // needs : BASE_WIDTH, BD.canvasWidth, BD.SCALE
        // ------------- constants -------------
        // var TO_RADIANS = Math.PI/180;
        // var TO_DEGREES = 180/Math.PI;


        var globalScale = BD ? BD.SCALE || 1 : 1;
        var containerList = [];
        var ctx,
            canvas;

        var mouseDown,
            mouseDownX,
            mouseDownY,
            mouseUpX,
            mouseUpY,
            oldChildren;


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
                document.addEventListener('touchmove', onmousemove);
            } else {
                canvas.onmousedown = onmousedown;
                canvas.onmouseup = onmouseup;
                canvas.onmousemove = onmousemove;
            }

            var s = new Container();

            return {
                view        : canvas,
                stage       : s,
                ticker      : new Ticker(),
                render      : redraw
            }
        };

        var Container = function() {
            var container = Object.assign(genericObject(),{
                    _type            : 'container',
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
            if (!texture){
                return genericObject(); //null;
            }
            var w = texture.width;
            var h = texture.height;
            return Object.assign(genericObject(),{
                    _type           : 'sprite',
                    texture         : texture,
                    width           : w,
                    height          : h,
                    naturalWidth    : w,
                    naturalHeight   : h
                }
            );
        };

        var Texture = function(asset, bounds) {
            if (asset instanceof Image){
                asset.bounds = bounds;
                return asset;
            } else {
                var a = Texture.fromImage(asset);
                a.bounds = bounds;
                return a;
            }
        };

        Texture.fromImage =  function(url) {
            var img = new Image();
            img.src = url;
            return img;
        };

        var Point = function(x, y) {
            return {
                _type       : 'point',
                x           : x,
                y           : y
            }
        };

        var Rectangle = function(x, y, w, h) {
            return {
                _type       : 'rectangle',
                x           : x,
                y           : y,
                w           : w,
                h           : h
            }
        };

        var Graphics = function() {
            return Object.assign(genericObject(),{
                    _type       : 'graphic',
                    beginFill   : function(data){},
                    drawRect    : function(data){},
                    endFill     : function(data){}
                }
            );
        };

        var Text = function(txt, options) {
            return Object.assign(genericObject(),{
                    _type       : 'text',
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
        };

        var removeChild = function(o) {
            if (!o){
                return false;
            }
            if (o._type == "container"){
                o.children = [];
            }
            this.children.splice(this.children.indexOf(o), 1);
        };

        var removeAll = function() {
            this.children = [];
            containerList.forEach(function(c) {
                c.children = [];
            })
        };

        var onmousedown = function (evt) {
            var p = getMousePosition(evt);
            mouseDownX = p.x;
            mouseDownY = p.y;
            mouseDown  = true;
            getChildrenAtCoord(mouseDownX, mouseDownY).forEach(function(c){
                if (c.mousedown){
                    c.mousedown(c);
                }
            })
        };

        var onmouseup = function (evt) {
            var p = getMousePosition(evt);
            mouseUpX = p.x;
            mouseUpY = p.y;
            mouseDown  = true;
            getChildrenAtCoord(mouseUpX, mouseUpY).forEach(function(c){
                if (c.mouseup){
                    c.mouseup(c);
                }
            })
        };

        var onmousemove = function (evt) {
            var p = getMousePosition(evt);
            var children = getChildrenAtCoord(p.x, p.y);
            children.forEach(function(c){
                if (c.mouseover && !c.mouseOverActive){
                    c.mouseover(c);
                    c.mouseOverActive = true;
                }
            });
            var orphans = (oldChildren || []).filter(function(x) { return children.indexOf(x) < 0 });
            orphans.forEach(function(c){
                if (c.mouseout && c.mouseOverActive){
                    c.mouseout(c);
                    c.mouseOverActive = false;
                }
            });
            oldChildren = children;
        };

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
            });
            return arr;
        };

        var getMousePosition = function (evt) {
            var left = canvas.offsetLeft || 0;
            var top = canvas.offsetTop || 0;

            var xsc = BASE_WIDTH/BD.canvasWidth;
            var ysc = BASE_HEIGHT/BD.canvasHeight;
            var x;
            var y;
            if (useTouch()) {
                x    = evt.targetTouches[0].clientX/globalScale*xsc;
                y    = evt.targetTouches[0].clientY/globalScale*ysc; // - $(window).scrollTop();
                return {x: x-left, y: y-top};
            } else {
                x    = (evt.clientX)/globalScale*xsc;
                y    = (evt.clientY)/globalScale*ysc;
                return {x: x-left, y: y-top};
            }
        };

        var redraw = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (var c=0; c<containerList.length; c++){
                var container = containerList[c];
                for (var i=0; i<container.children.length; i++){
                    var o = container.children[i];
                    if (o && o.scale){
                        var x = (o.x || o.position.x) + (container.x || container.position.x);
                        var y = (o.y || o.position.y) + (container.y || container.position.y);
                        var r = o.rotation + (container.rotation || 0)*TO_DEGREES;

                        var w = o.width || (o.texture ? o.texture.width : 0)
                        w *= (o.scale.x || 1)
                        w *= (container.scale.x || 1)
                        w *= (container.width ? container.width/(o.width || o.texture.width) : 1);

                        // parent container explicit size rules!
                        if (container.width){
                            w = container.width;
                        }

                        var h = o.height || (o.texture ? o.texture.height : 0)
                        h *= (o.scale.y || 1)
                        h *= (container.scale.y || 1)
                        h *= (container.height ? container.height/(o.height || o.texture.height) : 1);

                        // parent container explicit size rules!
                        if (container.height){
                            h = container.height;
                        }

                        var alpha = container.alpha * o.alpha;
                        o.___x = x;
                        o.___y = y;
                        o.___w = w;
                        o.___h = h;
                        if (o._type == "sprite") {
                            if (o.texture) {
                                drawRotatedImage(o, x, y, w, h, r, alpha);
                            }
                        } else if (o._type == "text") {
                            var h = parseInt(o.options.font) || 16;
                            ctx.font = o.options.font;
                            ctx.fillStyle = o.options.fill || "grey";
                            ctx.textAlign = o.options.align || "left";
                            var w = ctx.measureText(o.text).width;
                            var totalh = measureHeight(ctx, o.text, o.options.wordWrapWidth, h);

                            //TODO : remove magic number 12
                            // if (o.options.align === "center"){
                            //     ctx.fillText(o.text, x, y+12);
                            // } else if (o.options.align === "left"){
                            //     ctx.fillText(o.text, x - (w*o.anchor.x), y+12);
                            // }

                            if (o.options.align === "center"){
                                wrapText(ctx, o.text, x, y+6-((1-o.anchor.y)*totalh)+h/2, o.options.wordWrapWidth, h);
                            } else if (o.options.align === "left"){
                                wrapText(ctx, o.text, x - (w*o.anchor.x), y+6-((1-o.anchor.y)*totalh)+h/2, o.options.wordWrapWidth, h);
                            } else {
                                //ctx.fillText(o.text, x - (w*o.anchor.x), y+12);
                            }

                        }
                    }
                }
            }
        };

        // http: //www.html5canvastutorials.com/tutorials/html5-canvas-wrap-text-tutorial/
        function wrapText(context, text, x, y, maxWidth, lineHeight) {
            var cars = String(text).split("\n");
            for (var ii = 0; ii < cars.length; ii++) {
                var line = "";
                var words = cars[ii].split(" ");
                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + " ";
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > maxWidth) {
                        context.fillText(line, x, y);
                        line = words[n] + " ";
                        y += lineHeight;
                    }
                    else {
                        line = testLine;
                    }
                }
                context.fillText(line, x, y);
                y += lineHeight;
            }
        }

        function measureHeight(context, text, maxWidth, lineHeight) {
            var y = 0;
            var cars = String(text).split("\n");
            for (var ii = 0; ii < cars.length; ii++) {
                var line = "";
                var words = cars[ii].split(" ");
                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + " ";
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > maxWidth) {
                        line = words[n] + " ";
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                y += lineHeight;
            }
            return y;
        }


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
            window[d.name] = Texture.fromImage(d.url);
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



