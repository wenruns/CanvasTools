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
    console.log(this)
    this.canvasBox = document.getElementById(eleId);
    this.width = this.canvasBox.clientWidth;
    this.height = this.canvasBox.clientHeight;
    this.canvasBox.height = this.height;
    this.canvasBox.width = this.width;
    this.contexts = new Array();
    this.counter = 0;
    this.toDraw = [];
    this.hadDraw = [];
    this.drawing = false;
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

CanvasTools.prototype.draw = function () {
    if (this.drawing) {
        return;
    }
    this.drawing = true;
    let toDraw = this.toDraw;
    this.toDraw = [];
    let fn = () => {
        let index = Object.keys(toDraw).shift();
        if (index) {
            this.contexts[index].draw(() => {
                this.hadDraw[index] = toDraw[index];
                delete toDraw[index];
                if (Object.keys(toDraw).length) {
                    fn.call(this);
                } else {
                    this.drawing = false;
                    if (this.toDraw.length) {
                        this.draw();
                    }
                }
            })
        }
    };
    fn.call(this);

    return this;
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
    this.contexts.push((new CanvasImage(...arguments)));
    return this;
}

CanvasTools.prototype.pushToDraw = function (name) {
    this.toDraw[this.contexts.length] = name;
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
CanvasTools.prototype.addLine = function () {
    arguments[0].canvas = this;
    this.contexts.push((new CanvasLine(...arguments)));
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
    this.contexts.push((new CanvasText(...arguments)))
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
    this.contexts.push((new CanvasCircle(...arguments)))
    return this;
}

CanvasTools.prototype.switch = function (key, options) {
    if (options[key]) {
        options[key].call();
    } else if (options.default) {
        options.default.call();
    }
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
    this.contexts.push((new CanvasRect(...arguments)))
    return this;
}

/**************************************公共属性************************************/
if (typeof CommonAttributes != 'undefined') {
    delete CommonAttributes;
}
var CommonAttributes = function () {
    // console.log(this)
    this.canvas = arguments[0].canvas;
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
    this.globalCompositeOperation = 'source-over';
    this.rotate = 0;
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
        values: [],
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
            if (['r', 'width', 'height', 'left', 'right', 'bottom', 'top'].indexOf(i) >= 0 && typeof argv[i] == 'string') {
                let num = Number(argv[i].replace(/[^0-9]/ig, ""));
                if (argv[i].indexOf('%') >= 0) {
                    this.canvas.switch(i, {
                        width: () => {
                            this.width = this.canvas.width * num / 100;
                        },
                        height: () => {
                            this.height = this.canvas.height * num / 100;
                        },
                        r: () => {
                            this.r = Math.sqrt(Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)) * num / 100;
                        },
                        left: () => {
                            this.left = this.canvas.width * num / 100;
                        },
                        right: () => {
                            this.right = this.canvas.width * num / 100;
                        },
                        bottom: () => {
                            this.bottom = this.canvas.height * num / 100;
                        },
                        top: () => {
                            this.top = this.canvas.height * num / 100;
                        }
                    })
                } else {
                    this[i] = num;
                }
            } else {
                this[i] = argv[i];
            }
        }
    }
    if (!this.name) {
        this.name = this.constructor.name + "-" + this.canvas.counter;
        this.canvas.counter += 1;
    }
    if (arguments[0].ctx) {
        this.ctx = arguments[0].ctx;
    } else {
        this.ctx = this.canvas.canvasBox.getContext('2d');
        this.canvas.pushToDraw(this.name);
    }
    return this;
}

/**********************************圆圈***********************************/
if (typeof CanvasCircle != "undefined") {
    delete CanvasCircle;
}
var CanvasCircle = function () {
    CommonAttributes.call(this, ...arguments);
    // 计算x,y
    this.canvas.switch(this.align, {
        right: () => {
            this.x = this.canvas.width - this.r;
        },
        center: () => {
            this.x = this.canvas.width / 2;
        },
        default: () => {
            this.x = this.r;
        }
    })

    this.canvas.switch(this.vertical, {
        middle: () => {
            this.y = this.canvas.height / 2;
        },
        bottom: () => {
            this.y = this.canvas.height - this.r;
        },
        default: () => {
            this.y = this.r;
        }
    })
    if (this.left) {
        this.x += this.left;
    } else if (this.right) {
        this.x -= this.right;
    }
    if (this.top) {
        this.y += this.top;
    } else if (this.bottom) {
        this.y -= this.bottom;
    }
    if (typeof this.lineColor == 'object') {
        if (this.lineColor.values && this.lineColor.values.length) {
            this.lineColor = this.canvas.createGradient(this.ctx, {
                color: this.lineColor.values,
                angle: this.lineColor.angle ? this.lineColor.angle : 0,
                scale: this.lineColor.scale ? this.lineColor.scale : 1,
                type: this.lineColor.type ? this.lineColor.type : 'liner',
            }, 0, 0, this.r);
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
            }, 0, 0, this.r);
        }
    } else {
        this.bgColor = {
            values: this.bgColor,
        }
    }
    if ((this.content && !this.content.color) || (this.content && typeof this.content.color == 'object' && (!this.content.color.values || !this.content.color.values.length))) {
        this.content.color = 'black';
    }
    return this;
}

CanvasCircle.prototype.draw = function (callback = null) {
    let fn = (fillStyle, imgW, imgH) => {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.translate(this.x, this.y)
        this.ctx.globalCompositeOperation = this.globalCompositeOperation;
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.arc(0, 0, this.r, this.sAngle, this.eAngle, this.counterclockwise);
        // 实心圆
        if (fillStyle) {
            this.ctx.save();
            this.ctx.translate(-imgW / 2, -imgH / 2);
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = this.bgColor.values;
            this.ctx.fill();
        }
        // 空心圆
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.stroke();
        if (this.content && this.content.text) {
            this.content.ctx = this.ctx;
            this.content.textType = 'circle';
            this.content.r = this.r;
            if (!this.content.vertical) {
                this.content.vertical = 'middle';
            }
            if (!this.content.align) {
                this.content.align = 'center';
            }
            this.content.rotate = this.rotate;
            this.content.canvas = this.canvas;
            this.textCtx = new CanvasText(this.content);
            this.textCtx.draw();
        }
        this.ctx.restore();
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
    let x = 0, y = 0, x1 = 0, y1 = 0, fx = 1, fy = 1;
    if (!this.text) {
        throw new Error('未设置文本');
    }
    this.textW = this.ctx.measureText(this.text).width;

    this.canvas.switch(this.align, {
        right: () => {
            this.textAlign = 'right';
            x = -this.textW / 1.3;
            this.canvas.switch(this.textType, {
                default: () => {
                    // x1 += this.canvas.width;
                    x1 += this.canvas.width - this.textW / 1.2;
                    this.textAlign = 'center';
                    x = 0;
                },
                circle: () => {
                    x1 += this.r;
                },
                rect: () => {
                    x1 += this.width / 2;
                }
            })
        },
        center: () => {
            this.canvas.switch(this.textType, {
                default: () => {
                    x1 += (this.canvas.width) / 2;
                },
                circle: () => {

                },
                rect: () => {
                    // x1 += this.width / 2;
                }
            })
            x = 0;
            this.textAlign = 'center';
        },
        default: () => {
            this.textAlign = 'left';
            x = this.textW / 2;
            this.canvas.switch(this.textType, {
                default: () => {
                    this.textAlign = 'center';
                    x1 += this.textW / 1.2;
                    x = 0;
                },
                circle: () => {
                    x1 -= this.r;
                },
                rect: () => {
                    x1 -= this.width / 2;
                }
            })
            fx = -1 * fx;
        }
    })
    this.canvas.switch(this.vertical, {
        middle: () => {
            this.canvas.switch(this.textType, {
                default: () => {
                    y1 += this.canvas.height / 2;
                },
                circle: () => {

                },
                rect: () => {
                    // this.y += aL * Math.sin(aDeg * (Math.PI / 180));
                    // y1 += this.height / 2;
                }
            })
            this.textBaseline = 'middle';
        },
        bottom: () => {
            this.canvas.switch(this.textType, {
                default: () => {
                    y1 += this.canvas.height;
                },
                rect: () => {
                    y1 += this.height / 2;
                },
                circle: () => {
                    y1 += this.r;
                }
            })
            this.textBaseline = 'bottom';
        },
        default: () => {
            this.canvas.switch(this.textType, {
                circle: () => {
                    y1 -= this.r;
                },
                rect: () => {
                    y1 -= this.height / 2;
                }
            })
            this.textBaseline = 'top';
        }
    })
    if (this.top) {
        y1 += this.top;
    } else if (this.bottom) {
        y1 -= this.bottom;
    }
    if (this.left) {
        x1 += this.left;
    } else if (this.right) {
        x1 -= this.right;
    }
    if (this.textType) {
        let aDeg = Math.atan(y1 / x1) / (Math.PI / 180),
            aL = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2));
        if (!aDeg) {
            aDeg = 0;
        }
        aDeg = (this.rotate + aDeg) % 360;
        this.x += aL * Math.cos(aDeg * (Math.PI / 180)) * fx;
        this.y += aL * Math.sin(aDeg * (Math.PI / 180)) * fx;
    } else {
        this.x += x1;
        this.y += y1;
    }

    if (typeof this.textColor == 'object') {
        this.textColor = this.canvas.createGradient(this.ctx, {
            color: this.textColor.values,
            type: this.textColor.type ? this.textColor.type : 'liner',
            scale: this.textColor.scale ? this.textColor.scale : 1,
            angle: this.textColor.angle ? this.textColor.angle + this.rotate : this.rotate,
        }, x, y, this.textW)
    }
    // this.canvas.switch(this.textType, {
    //     null: () => {
    //         console.log('<<<<<<');
    //         console.log('this.x=' + this.x, 'this.y=' + this.y, 'fx=' + fx)
    //         console.log(this.align, this.vertical, this.textType)
    //         console.log('w=' + this.width, 'h=' + this.height);
    //         console.log('x1=' + x1, 'y1=' + y1);
    //         console.log('deg=' + aDeg, 'al=' + aL)
    //         console.log('cos=' + aL * Math.cos(aDeg * (Math.PI / 180)), "sin=" + aL * Math.sin(aDeg * (Math.PI / 180)));
    //         // console.log(this.textW * (Math.cos(this.rotate * (Math.PI / 180))));
    //         console.log(x, y, this.text)
    //         console.log('>>>>>');
    //
    //     }
    // })
    return this;
}

CanvasText.prototype.draw = function (callback = null) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.translate(this.x, this.y);
    this.ctx.rotate(this.rotate * Math.PI / 180);
    this.ctx.globalCompositeOperation = this.globalCompositeOperation;
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
            this.ctx.strokeText(this.text, 0, 0, this.maxWidth);
        } else {
            this.ctx.strokeText(this.text, 0, 0);
        }
    } else {
        this.ctx.fillStyle = this.textColor;
        if (this.maxWidth > 0) {
            this.ctx.fillText(this.text, 0, 0, this.maxWidth);
        } else {
            this.ctx.fillText(this.text, 0, 0);
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

    if (!this.bgColor.angle || this.bgColor.angle % 360 == 0 || this.bgColor.angle % 360 == 180) {
        this.r = this.width / 2;
    } else if (this.bgColor.angle % 360 == 90 || this.bgColor.angle % 360 == 270) {
        this.r = this.height / 2;
    } else {
        this.r = Math.sqrt(Math.pow(this.width, 2) + Math.pow(this.height, 2)) / 2;
    }
    if (typeof this.lineColor == 'object') {
        if (this.lineColor.values.length) {
            this.lineColor = this.canvas.createGradient(this.ctx, {
                color: this.lineColor.values,
                type: this.lineColor.type ? this.lineColor.type : 'liner',
                scale: this.lineColor.scale ? this.lineColor.scale : 1,
                angle: this.lineColor.angle ? this.lineColor.angle : 0,
            }, 0, 0, this.r);
        }
    }
    if (typeof this.bgColor == 'object') {
        if (this.bgColor.values.length) {
            this.bgColor.values = this.canvas.createGradient(this.ctx, {
                color: this.bgColor.values,
                type: this.bgColor.type ? this.bgColor.type : 'liner',
                scale: this.bgColor.scale ? this.bgColor.scale : 1,
                angle: this.bgColor.angle ? this.bgColor.angle : 0,
            }, 0, 0, this.r);
        }
    } else {
        this.bgColor = {
            values: this.bgColor,
        }
    }
    return this;
}
CanvasRect.prototype.draw = function (callback) {
    let fn = (fillStyle, imgW, imgH) => {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = this.globalCompositeOperation;
        this.x += this.width / 2;
        this.y += this.height / 2;
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(Number(this.rotate) * Math.PI / 180);
        this.ctx.rect(0 - this.width / 2, 0 - this.height / 2, this.width, this.height);
        if (fillStyle) {
            this.ctx.translate(-imgW / 2, -imgH / 2);
        } else {
            fillStyle = this.bgColor.values;
        }
        if (fillStyle instanceof CanvasGradient || fillStyle instanceof CanvasPattern || fillStyle.length) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.stroke();
        this.ctx.restore();
        if (this.content && this.content.text) {
            // this.ctx.save();
            this.content.ctx = this.ctx;
            this.content.textType = 'rect';
            this.content.x = this.x;
            this.content.y = this.y;
            this.content.rotate = this.rotate;
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
            // this.ctx.restore();
        }
        callback && callback.call(this);
    }
    if (this.bgColor.url) {
        this.canvas.createImageElement(this.bgColor.url, (img) => {
            let bg = this.ctx.createPattern(img, this.bgColor.repeat ? 'repeat' : 'no-repeat');
            fn.call(this, bg, img.width, img.height);
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
    return this;
}
CanvasImage.prototype.draw = function (callback) {
    this.canvas.createImageElement(this.imgUrl, (img) => {
        this.ctx.save();
        this.ctx.beginPath();
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
        this.x += this.width / 2;
        this.y += this.height / 2;
        this.ctx.translate(this.x, this.y);
        this.ctx.globalCompositeOperation = this.globalCompositeOperation;
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        if (this.imgCut) {
            this.ctx.drawImage(img, this.sx, this.sy, this.swidth, this.sheight, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            this.ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        }
        this.ctx.restore();
        callback && callback.call(this);
    })
    return this;
}

/*************************************连线*************************************/
if (typeof CanvasLine != 'undefined') {
    delete CanvasLine;
}
var CanvasLine = function () {
    CommonAttributes.call(this, ...arguments);
    let minX = 0, minY = 0, maxX = 0, maxY = 0, points = [], px = 0, py = 0;
    this.points.forEach((point, key) => {
        if (typeof point == 'object') {
            if (typeof point[0] == 'string') {
                let num = Number(point[0].replace(/[^0-9]/ig, ''));
                if (point[0].indexOf('%') >= 0) {
                    px = this.canvas.width * num / 100;
                } else {
                    px = num;
                }
            } else {
                px = point[0];
            }
            if (typeof point[1] == 'string') {
                let num = Number(point[1].replace(/[^0-9]/ig, ''));
                if (point[1].indexOf('%') >= 0) {
                    py = this.canvas.height * num / 100;
                } else {
                    py = num;
                }
            } else {
                py = point[1];
            }
        } else {
            if (typeof point == 'string') {
                let num = Number(point.replace(/[^0-9]/ig, ''));
                if (point.indexOf('%') >= 0) {
                    px = this.canvas.width * num / 100;
                    py = this.canvas.height * num / 100;
                } else {
                    py = px = num;
                }
            } else {
                px = py = point;
            }
        }
        if (key == 0) {
            minX = maxX = px;
            minY = maxY = py;
        } else {
            if (minX > px) {
                minX = px;
            }
            if (minY > py) {
                minY = py;
            }
            if (maxX < px) {
                maxX = px;
            }
            if (maxY < py) {
                maxY = py;
            }
        }
        points.push([px, py]);
    })
    this.points = points;
    this.maxX = maxX;
    this.minX = minX;
    this.maxY = maxY;
    this.minY = minY;
    this.r = Math.sqrt(Math.pow(this.maxX - this.minX, 2) + Math.pow(this.maxY - this.minY, 2)) / 2;
    return this;
}
CanvasLine.prototype.draw = function (callback) {
    if (this.points.length) {
        this.ctx.save();
        this.ctx.beginPath();
        let rX = (this.maxX - this.minX) / 2, rY = (this.maxY - this.minY) / 2;
        this.ctx.translate(this.minX + rX, this.minY + rY);
        this.ctx.rotate(this.rotate * Math.PI / 180);
        this.ctx.globalCompositeOperation = this.globalCompositeOperation;
        this.ctx.lineJoin = this.lineJoin;
        this.ctx.miterLimit = this.miterLimit;
        this.ctx.shadowColor = this.shadowColor;
        this.ctx.shadowBlur = this.shadowBlur;
        this.ctx.shadowOffsetY = this.shadowOffsetY;
        this.ctx.shadowOffsetX = this.shadowOffsetX;
        this.ctx.lineCap = this.lineCap;
        this.ctx.lineWidth = this.lineWidth;
        // console.log(this.maxX, this.minX, this.maxY, this.minY)
        // console.log(this.x, this.y, this.r, rX, rY)
        this.points.forEach((point, key) => {
            // console.log(point, point[0] - rX - this.minX, point[1] - rY - this.minY)
            if (key == 0) {
                this.ctx.moveTo(point[0] - rX - this.minX, point[1] - rY - this.minY);
            } else {
                this.ctx.lineTo(point[0] - rX - this.minX, point[1] - rY - this.minY);
            }
        })
        if (typeof this.lineColor == 'object') {
            if (this.lineColor.values.length) {
                this.lineColor = this.canvas.createGradient(this.ctx, {
                    color: this.lineColor.values,
                    angle: this.lineColor.angle ? this.lineColor.angle : 0,
                    scale: this.lineColor.scale ? this.lineColor.scale : 1,
                    type: this.lineColor.type ? this.lineColor.type : 'liner',
                }, 0, 0, this.r);
            } else {
                this.lineColor = 'black';
            }
        }
        this.ctx.strokeStyle = this.lineColor;
        this.ctx.stroke();
        this.ctx.restore();
        callback && callback.call(this);
    }
    return this;
}

/*************************************扇形*************************************/
