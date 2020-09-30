if (typeof CanvasTools != 'undefined') {
    delete CanvasTools;
}

var CanvasTools = function ({
                                eleId,
                                bgColor = {
                                    values: [],
                                    angle: 0,
                                    type: 'liner',
                                    url: null,
                                    repeat: false,
                                },
                            }) {
    this.configs = {
        eleId,
        bgColor,
    }
    this.canvasBox = document.getElementById(eleId);
    this.width = this.canvasBox.width;
    this.height = this.canvasBox.height;
    this.contexts = new Array();
    this.counter = 0;
    this.init();
}

CanvasTools.prototype.init = function () {
    if (typeof this.configs.bgColor == 'object') {
        if (this.configs.bgColor.url) {
            this.canvasBox.style.background = 'url("' + this.configs.bgColor.url + '")';
            this.canvasBox.style["background-position"] = 'center';
            if (!this.configs.bgColor.repeat) {
                this.canvasBox.style['background-repeat'] = 'no-repeat';
            }
        } else {
            let color = '';
            if (this.configs.bgColor.values.length == 1) {
                color = this.configs.bgColor.values[0];
            } else {
                this.configs.bgColor.values.forEach((item) => {
                    if (color) {
                        color += ',';
                    }
                    if (typeof item == 'object') {
                        color += item[0] + " " + item[1];
                    } else {
                        color += item;
                    }
                })
                if (this.configs.bgColor.type == 'radial') {
                    color = 'radial-gradient(circle' + color + ')';
                } else {
                    if (this.configs.bgColor.angle) {
                        color = this.configs.bgColor.angle + 'deg,' + color;
                    }
                    color = 'linear-gradient(' + color + ')';
                }
            }
            this.canvasBox.style['background'] = color;
        }
    } else {
        this.canvasBox.style.background = this.configs.bgColor;
    }
}

CanvasTools.prototype.createImageElement = function (url, onload) {
    let img = new Image();
    img.crossOrigin = 'anonymous'
    img.onload = () => {
        onload && onload.call(this, img)
    };
    img.src = url;
}


/**
 * 添加图片层
 * @param name
 * @param coverName
 * @param imgUrl
 * @param isCut
 * @param sx
 * @param sy
 * @param swidth
 * @param sheight
 * @param x
 * @param y
 * @param width
 * @param height
 * @param align
 * @returns {*}
 */
CanvasTools.prototype.addImage = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasImage(...arguments)).draw());
    return this;
}


/**
 * 折线
 * @param name
 * @param ctx
 * @param color
 * @param points
 * @param lineWidth
 * @param lineJoin
 * @param miterLimit
 * @param lineCap
 * @param shadowColor
 * @param shadowBlur
 * @param shadowOffsetX
 * @param shadowOffsetY
 * @returns {CanvasTools}
 */
CanvasTools.prototype.line = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasLine(...arguments)).draw());
    return this;
}

/**
 * 添加文本
 * @param text
 * @param ctx
 * @param color
 * @param align
 * @param font
 * @param top
 * @param bottom
 * @param left
 * @param right
 * @param isStroke
 */
CanvasTools.prototype.addText = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasText(...arguments)).draw())
    return this;
}

/**
 * 创建线性或者放射性渐变颜色
 * @param ctx
 * @param options
 * @param x
 * @param y
 * @param r
 * @returns {CanvasGradient}
 */
CanvasTools.prototype.createGradient = function (ctx, options, x = 0, y = 0, r = 0) {
    let gradient = null, point = 1 / (options.color.length > 1 ? options.color.length - 1 : options.color.length);
    if (options.type && options.type == 'radial') {
        let scale = options.scale ? options.scale : 1;
        gradient = ctx.createRadialGradient(x, y, 0, x, y, scale * r)
    } else {
        let sx = 0, sy = 0, ex = 0, ey = 0;
        if (options.angle) {
            let angle = options.angle % 360, h = r * Math.sin(angle * ((2 * Math.PI) / 360)),
                w = r * Math.cos(angle * ((2 * Math.PI) / 360));
            sx = x - w;
            ex = x + w;
            sy = y - h;
            ey = y + h;
        } else {
            sx = x - r;
            ex = x + r;
            sy = ey = y;
        }
        gradient = ctx.createLinearGradient(sx, sy, ex, ey);
    }
    options.color.forEach(function (item, key) {
        // console.log(item, key, key * point)
        gradient.addColorStop(key * point, item);
    })
    return gradient;
}

/**
 * 添加一个圆圈，可带文本
 * @returns {CanvasTools}
 */
CanvasTools.prototype.addCircle = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasCircle(...arguments)).draw())
    return this;
}


/**
 * 贝塞尔曲线   todo:: 曲线切线的交点算法求解x,y
 * @param points
 * @param color
 * @returns {CanvasTools}
 */
CanvasTools.prototype.curveLine = function ({
                                                points = [],
                                                color = {
                                                    values: [],
                                                    type: 'liner',
                                                    scale: 1,
                                                }
                                            }) {
    let ctx = this.canvasBox.getContext('2d'), x = 0, y = 0, x1 = 0, y1 = 0, maxX = 0, maxY = 0, minX = 0, minY = 0;
    if (points.length) {
        points.forEach((item, i) => {
            if (typeof item == 'object') {
                x = item[0];
                y = item[1];
            } else {
                x = y = item;
            }
            if (minX > x) minX = x;
            if (minY > y) minY = y;
            if (maxX < x) maxX = x;
            if (maxY < y) maxY = y;
            if (i == 0) {
                ctx.moveTo(x, y)
            }
            let vo = points[i + 1];
            if (vo) {
                if (typeof vo == 'object') {
                    x1 = vo[0];
                    y1 = vo[1];
                } else {
                    x1 = y1 = vo;
                }
                ctx.quadraticCurveTo(x, y, x1, y1);
            }
        })
        if (typeof color == 'object') {
            if (color.values.length) {
                let x = (maxX - minX) / 2, y = (maxY - minY) / 2, r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                color = this.createGradient(ctx, {
                    color: color.values,
                    type: color.type ? color.type : 'liner',
                    scale: color.scale ? color.scale : 1,
                    angle: color.angle ? color.angle : 0,
                }, x, y, r);
            } else {
                color = 'rgba(0,0,0,1)';
            }
        }
        ctx.strokeStyle = color;
        ctx.stroke();
    }
    return this;
}

CanvasTools.prototype.addRect = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasRect(...arguments)).draw())
    return this;
}

/**************************************公共属性************************************/
var CommonAttributes = function () {
    this.canvas = arguments[0].canvas;
    if (arguments[0].ctx) {
        this.ctx = arguments[0].ctx;
    } else {
        this.ctx = this.canvas.canvasBox.getContext('2d');
    }
    this.points = [];
    this.imgUrl = '';
    this.imgCut = false;
    this.sx = 0;
    this.sy = 0;
    this.swidth = 0;
    this.sheight = 0;
    this.r = 0;
    this.y = 0;
    this.x = 0;
    this.width = 0;
    this.height = 0;
    this.name = null;
    this.sAngle = 0;
    this.eAngle = 2 * Math.PI;
    this.counterclockwise = false;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.bgColor = {
        values: [],
        type: 'liner',
        scale: 1,
        angle: 0,
        url: null,
        repeat: false,
    };
    this.align = 'left';
    this.vertical = 'top';
    this.text = '';
    this.font = {
        style: "normal",
        variant: "normal",
        weight: "normal",
        size: "1rem",  //规定字号和行高，以像素计。
        family: "黑体", //规定字体系列。
        caption: "黑体", //使用标题控件的字体（比如按钮、下拉列表等）。
        icon: "黑体", //使用用于标记图标的字体。
        menu: "黑体", //使用用于菜单中的字体（下拉列表和菜单列表）。
        "message-box": "黑体", //使用用于对话框中的字体。
        "small-caption": "黑体",//使用用于标记小型控件的字体。
        "status-bar": "黑体", //使用用于窗口状态栏中的字体。
    };

    this.textAlign = 'left';
    this.textBaseLine = 'top';
    this.isStroke = false;
    this.textColor = {
        values: ['black'],
        type: 'liner',
        scale: 1,
        angle: 0,
    };
    this.maxWidth = null;
    this.textType = null;
    this.shadowColor = 'black';
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.miterLimit = 0;
    this.lineJoin = 'round';
    this.lineCap = 'round';
    this.lineColor = {
        values: ['black'],
        type: 'liner',
        scale: 1,
        angle: 0,
    };
    this.lineWidth = 1;
    let argv = arguments[0];
    for (var i in argv) {
        if (typeof argv[i] == 'object') {
            for (var j in argv[i]) {
                if (!this[i]) {
                    this[i] = {};
                }
                this[i][j] = argv[i][j];
            }
        } else {
            this[i] = argv[i];
        }
    }
    return this;
}

/**********************************圆圈***********************************/
if (typeof CanvasCircle != "undefined") {
    delete CanvasCircle;
}
var CanvasCircle = function () {
    CommonAttributes.call(this, ...arguments);
    if (!this.name) {
        this.name = 'circle-' + this.canvas.counter;
        this.canvas.counter += 1;
    }
    // 计算x,y
    this.x = this.r;
    this.y = this.r;
    if (this.left) {
        this.x = this.r + this.left;
    } else if (this.right) {
        this.x = this.canvas.width - this.r - this.right;
    }
    if (this.top) {
        this.y = this.r + this.top;
    } else if (this.bottom) {
        this.y = this.canvas.height - this.r - this.bottom;
    }
    if (typeof this.lineColor == 'object') {
        if (this.lineColor.values && this.lineColor.values.length) {
            this.lineColor = this.canvas.createGradient(this.ctx, {
                color: this.lineColor.values,
                angle: this.lineColor.angle ? this.lineColor.angle : 0,
                scale: this.lineColor.scale ? this.lineColor.scale : 1,
                type: this.lineColor.type ? this.lineColor.type : 'liner',
            }, this.x, this.y, this.r);
        } else {
            this.lineColor = 'black';
        }
    }
    if (typeof this.bgColor == 'object') {
        if (this.bgColor.values && this.bgColor.values.length) {
            this.bgColor.values = this.canvas.createGradient(this.ctx, {
                color: this.bgColor.values,
                angle: this.bgColor.angle ? this.bgColor.angle : 0,
                scale: this.bgColor.scale ? this.bgColor.scale : 1,
                type: this.bgColor.type ? this.bgColor.type : 'liner',
            }, this.x, this.y, this.r);
        }
    }
    if (!this.content.color || (typeof this.content.color == 'object' && (!this.content.color.values || !this.content.color.values.length))) {
        this.content.color = 'black';
    }
    return this;
}

CanvasCircle.prototype.draw = function (callback = null) {
    let fn = (fillStyle, imgW, imgH) => {
        this.ctx.save();
        this.ctx.beginPath();
        // 实心圆
        this.ctx.arc(this.x, this.y, this.r, this.sAngle, this.eAngle, this.counterclockwise);
        if (fillStyle) {
            this.ctx.translate(this.x - imgW / 2, this.y - imgH / 2);
        } else {
            fillStyle = this.bgColor.values;
        }
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.restore();
        // 空心圆
        this.ctx.save();
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.stroke();
        this.ctx.restore();
        if (this.content && this.content.text) {
            this.ctx.save();
            this.ctx.translate(this.x, this.y)
            this.content.ctx = this.ctx;
            this.content.textType = 'circle';
            this.content.r = this.r;
            if (!this.content.vertical) {
                this.content.vertical = 'middle';
            }
            if (!this.content.align) {
                this.content.align = 'center';
            }
            this.content.canvas = this.canvas;
            this.textCtx = new CanvasText(this.content);
            this.textCtx.draw();
            this.ctx.restore();
        }
        callback && callback.call(this);
    }
    if (this.bgColor.url) {
        this.canvas.createImageElement(this.bgColor.url, (img) => {
            let bg = this.ctx.createPattern(img, this.bgColor.repeat ? 'repeat' : 'no-repeat');
            fn.call(this, bg, img.width, img.height)
        });
    } else {
        fn.call(this)
    }
    return this;
}


/************************************文本**************************************/
if (typeof CanvasText != 'undefined') {
    delete CanvasText;
}
var CanvasText = function () {
    CommonAttributes.call(this, ...arguments);
    let x = this.x, y = this.y;
    if (!this.text) {
        throw new Error('未设置文本');
    }
    this.textW = this.ctx.measureText(this.text).width;

    this.switch(this.align, {
        right: () => {
            this.switch(this.textType, {
                default: () => {
                    this.x = this.canvas.width;
                },
                circle: () => {
                    this.x = this.r;
                },
                rect: () => {
                    this.x = this.width;
                }
            })
            x = this.x - this.textW / 1.5;
            this.textAlign = 'right';
        },
        center: () => {
            this.switch(this.textType, {
                default: () => {
                    this.x = (this.canvas.width) / 2;
                },
                rect: () => {
                    this.x = this.width / 2;
                }
            })
            x = this.x;
            this.textAlign = 'center';
        },
        default: () => {
            this.switch(this.textType, {
                circle: () => {
                    this.x = -this.r;
                },
            })
            x = this.x + this.textW / 1.5;
            this.textAlign = 'left';
        }
    })

    this.switch(this.vertical, {
        middle: () => {
            this.switch(this.textType, {
                default: () => {
                    this.y = this.canvas.height / 2;
                },
                rect: () => {
                    this.y = this.height / 2;
                }
            })
            this.textBaseline = 'middle';
        },
        bottom: () => {
            this.switch(this.textType, {
                default: () => {
                    this.y = this.canvas.height;
                },
                rect: () => {
                    this.y = this.height;
                },
                circle: () => {
                    this.y = this.r;
                }
            })
            this.textBaseline = 'bottom';
        },
        default: () => {
            this.switch(this.textType, {
                circle: () => {
                    this.y = -this.r;
                }
            })
            this.textBaseline = 'top';
        }
    })
    if (this.top) {
        this.y = this.y + this.top;
    } else if (this.bottom) {
        this.y = this.y - this.bottom;
    }
    if (this.left) {
        this.x = this.x + this.left;
        x += this.left;
    } else if (this.right) {
        this.x = this.x - this.right;
        x -= this.right;
    }
    if (!this.name) {
        this.name = 'text-' + this.canvas.counter;
        this.canvas.counter += 1;
    }
    if (typeof this.textColor == 'object') {
        // console.log(this.x, this.y, this.textW, '.>>>>>')
        this.textColor = this.canvas.createGradient(this.ctx, {
            color: this.textColor.values,
            type: this.textColor.type ? this.textColor.type : 'liner',
            scale: this.textColor.scale ? this.textColor.scale : 1,
            angle: this.textColor.angle ? this.textColor.angle : 0,
        }, x, y, this.textW / 2)
    }
}

CanvasText.prototype.switch = function (key, callbacks) {
    switch (key) {
        case 'circle':
            callbacks.circle && callbacks.circle.call(this);
            break;
        case 'rect':
            callbacks.rect && callbacks.rect.call(this);
            break;
        case 'right':
            callbacks.right && callbacks.right.call(this);
            break;
        case 'center':
            callbacks.center && callbacks.center.call(this);
            break;
        case 'middle':
            callbacks.middle && callbacks.middle.call(this);
            break;
        case 'bottom':
            callbacks.bottom && callbacks.bottom.call(this);
            break;
        default:
            callbacks.default && callbacks.default.call(this);
    }
}

CanvasText.prototype.draw = function (callback = null) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.shadowBlur = this.shadowBlur;
    this.ctx.shadowColor = this.shadowColor;
    this.ctx.shadowOffsetX = this.shadowOffsetX;
    this.ctx.shadowOffsetY = this.shadowOffsetY;
    this.ctx.textBaseline = this.textBaseline;
    this.ctx.textAlign = this.textAlign;
    this.ctx.font = Object.values(this.font).join(' ');
    this.ctx.lineWidth = this.lineWidth;
    if (this.isStroke) {
        this.ctx.strokeStyle = this.textColor;
        if (this.maxWidth > 0) {
            this.ctx.strokeText(this.text, this.x, this.y, this.maxWidth);
        } else {
            this.ctx.strokeText(this.text, this.x, this.y);
        }
    } else {
        this.ctx.fillStyle = this.textColor;
        if (this.maxWidth > 0) {
            this.ctx.fillText(this.text, this.x, this.y, this.maxWidth);
        } else {
            this.ctx.fillText(this.text, this.x, this.y);
        }
    }
    this.ctx.restore();
    callback && callback.call(this);
    return this;
}

/***********************************方块***************************************/
if (typeof CanvasRect != 'undefined') {
    delete CanvasRect;
}
var CanvasRect = function () {
    CommonAttributes.call(this, ...arguments);
    // console.log(this);
    if (this.align == 'right') {
        this.x = this.canvas.width - this.width;
    } else if (this.align == 'center') {
        this.x = (this.canvas.width - this.width) / 2;
    }
    if (this.vertical == 'middle') {
        this.y = (this.canvas.height - this.height) / 2;
    } else if (this.vertical == 'bottom') {
        this.y = this.canvas.height - this.height;
    }
    if (this.left) {
        this.x = this.x + this.left;
    } else if (this.right) {
        this.x = this.x - this.right;
    }
    if (this.top) {
        this.y = this.y + this.top;
    } else if (this.bottom) {
        this.y = this.y - this.bottom;
    }
    if (typeof this.lineColor == 'object') {
        if (this.lineColor.values.length) {
            this.lineColor = this.canvas.createGradient(this.ctx, {
                color: this.lineColor.values,
                type: this.lineColor.type ? this.lineColor.type : 'liner',
                scale: this.lineColor.scale ? this.lineColor.scale : 1,
                angle: this.lineColor.angle ? this.lineColor.angle : 0,
            }, this.x + this.width / 2, this.y + this.height / 2, this.width)
        } else {
            this.lineColor = 'black';
        }
    }
    if (typeof this.bgColor == 'object') {
        if (this.bgColor.values.length) {
            this.bgColor.values = this.canvas.createGradient(this.ctx, {
                color: this.bgColor.values,
                type: this.bgColor.type ? this.bgColor.type : 'liner',
                scale: this.bgColor.scale ? this.bgColor.scale : 1,
                angle: this.bgColor.angle ? this.bgColor.angle : 0,
            }, this.x + this.width / 2, this.y + this.height / 2, this.width)
        } else {
            this.bgColor.values = 'black';
        }
    }
}
CanvasRect.prototype.draw = function (callback) {
    let fn = (fillStyle, imgW, imgH) => {
        this.ctx.save();
        this.ctx.rect(this.x, this.y, this.width, this.height);
        if (fillStyle) {
            console.log(imgW, imgH)
            this.ctx.translate(this.x + (this.width - imgW) / 2, this.y + (this.height - imgH) / 2);
        } else {
            fillStyle = this.bgColor.values;
        }
        this.ctx.fillStyle = fillStyle;
        this.ctx.fill();
        this.ctx.restore();
        this.ctx.save()
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.stroke();
        this.ctx.restore();
        if (this.content && this.content.text) {
            this.ctx.save();
            this.ctx.translate(this.x, this.y)
            this.content.ctx = this.ctx;
            this.content.textType = 'rect';
            if (!this.content.vertical) {
                this.content.vertical = 'middle';
            }
            if (!this.content.align) {
                this.content.align = 'center';
            }
            this.content.width = this.width;
            this.content.height = this.height;
            this.content.canvas = this.canvas;
            this.textCtx = new CanvasText(this.content);
            this.textCtx.draw();
            this.ctx.restore();
        }
        callback && callback.call(this);
    }
    if (this.bgColor.url) {
        this.canvas.createImageElement(this.bgColor.url, (img) => {
            let bg = this.ctx.createPattern(img, this.bgColor.repeat ? 'repeat' : 'no-repeat');
            fn.call(this, bg, img.width, img.height)
        })
    } else {
        fn.call(this);
    }
    return this;
}

/**********************************图片****************************************/
if (typeof CanvasImage != 'undefined') {
    delete CanvasImage;
}
var CanvasImage = function () {
    CommonAttributes.call(this, ...arguments);
    if (name && this.contexts[name] && !coverName) {
        throw new Error(name + ' 索引已存在，如需可设置参数coverName:true强制覆盖原有context')
    }
    return this;
}
CanvasImage.prototype.draw = function () {
    this.canvas.createImageElement(this.imgUrl, (img) => {
        this.ctx.save();
        if (!this.width && !this.height) {
            this.width = img.width;
            this.height = img.height;
        } else if (!this.width || !this.height) {
            let p = img.width / img.height;
            this.width ? this.height = this.width / p : this.width = this.height * p;
        }
        switch (this.align) {
            case 'center':
                this.x = (this.canvas.width - this.width) / 2;
                break;
            case 'right':
                this.x = this.canvas.width - this.width;
                break;
        }
        switch (this.vertical) {
            case 'middle':
                this.y = (this.canvas.height - this.height) / 2;
                break;
            case 'bottom':
                this.y = this.canvas.height - this.height;
                break;
        }
        if (this.left) {
            this.x = this.x + this.left;
        } else if (this.right) {
            this.x = this.x - this.right;
        }
        if (this.top) {
            this.y = this.y + this.top;
        } else if (this.bottom) {
            this.y = this.y - this.bottom;
        }
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        if (this.imgCut) {
            this.ctx.drawImage(img, this.sx, this.sy, this.swidth, this.sheight, this.x, this.y, this.width, this.height);
        } else {
            this.ctx.drawImage(img, this.x, this.y, this.width, this.height);
        }
        this.ctx.restore();
    })
    return this;
}

/**************************************************************************/
if (typeof CanvasLine != 'undefined') {
    delete CanvasLine;
}
var CanvasLine = function () {
    CommonAttributes.call(this, ...arguments);
    return this;
}
CanvasLine.prototype.draw = function () {
    if (this.points.length) {
        let minX = 0, minY = 0, maxX = 0, maxY = 0, points = this.points;
        this.ctx.save();
        let beginPoint = points.shift();
        this.ctx.beginPath();
        this.ctx.lineJoin = this.lineJoin;
        this.ctx.miterLimit = this.miterLimit;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        this.ctx.lineCap = this.lineCap;
        this.ctx.lineWidth = this.lineWidth;
        if (typeof beginPoint == 'object') {
            maxX = minX = beginPoint[0];
            maxY = minY = beginPoint[1];
            this.ctx.moveTo(beginPoint[0], beginPoint[1]);
        } else {
            maxX = maxY = minX = minY = beginPoint;
            this.ctx.moveTo(beginPoint, beginPoint);
        }
        points.forEach((point) => {
            if (typeof point == 'object') {
                if (minX > point[0]) {
                    minX = point[0];
                }
                if (minY > point[1]) {
                    minY = point[1];
                }
                if (maxX < point[0]) {
                    maxX = point[0];
                }
                if (maxY < point[1]) {
                    maxY = point[1];
                }
                this.ctx.lineTo(point[0], point[1])
            } else {
                if (minX > point) {
                    minX = point;
                }
                if (minY > point) {
                    minY = point;
                }
                if (maxX < point) {
                    maxX = point;
                }
                if (maxY < point) {
                    maxY = point;
                }
                this.ctx.lineTo(point, point)
            }
        })
        if (typeof this.lineColor == 'object') {
            if (this.lineColor.values.length) {
                let r = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)) / 2;
                this.lineColor = this.canvas.createGradient(this.ctx, {
                    color: this.lineColor.values,
                    angle: this.lineColor.angle ? this.lineColor.angle : 0,
                    scale: this.lineColor.scale ? this.lineColor.scale : 1,
                    type: this.lineColor.type ? this.lineColor.type : 'liner',
                }, minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, r)
            } else {
                this.lineColor = 'black';
            }
        }
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.stroke();
        this.ctx.restore();
    }
    return this;
}
