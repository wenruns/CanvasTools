let CanvasTools = function ({
                                eleId,
                                bgColor = 'white',
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
    this.onLoads = [];
    this.init();
}

CanvasTools.prototype.init = function () {
    this.bgContext = this.canvasBox.getContext('2d');
    this.bgContext.fillStyle = this.configs.bgColor;
    this.bgContext.fillRect(0, 0, this.width, this.height);
}
// CanvasTools.prototype.onLoad = function () {
//     window.onload = () => {
//     this.onLoads.forEach((item) => {
//         console.log(item, '===<')
//         var func = item.fn;
//         func(...item.args);
//     })
//     }
// }


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
CanvasTools.prototype.addImage = function ({
                                               ctx = null,
                                               name = null,
                                               coverName = false,
                                               imgUrl,
                                               isCut = false,
                                               sx = 0,
                                               sy = 0,
                                               swidth = 0,
                                               sheight = 0,
                                               left = false,
                                               right = false,
                                               top = false,
                                               bottom = false,
                                               width = 0,
                                               height = 0,
                                               align = 'left',
                                               vertical = 'top',
                                               shadowColor = 'black',
                                               shadowBlur = 0,
                                               shadowOffsetX = 0,
                                               shadowOffsetY = 0,
                                           }) {
    if (name && this.contexts[name] && !coverName) {
        throw new Error(name + ' 索引已存在，如需可设置参数coverName:true强制覆盖原有context')
    }
    if (!ctx) {
        ctx = this.canvasBox.getContext('2d');
        if (name === null || !name) {
            name = this.counter;
            this.counter += 1;
        }
        this.contexts[name] = {
            ctx,
            name,
            coverName,
            isCut,
            width,
            height,
            left,
            right,
            top,
            bottom,
            sx,
            sy,
            swidth,
            sheight,
            align,
            vertical,
            imgUrl,
            shadowColor,
            shadowBlur,
            shadowOffsetX,
            shadowOffsetY,
        };
    }
    let img = new Image(), x = 0, y = 0;

    img.src = imgUrl;
    img.onload = () => {
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = shadowColor;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.shadowOffsetX = shadowOffsetX;
        if (!width && !height) {
            width = img.width;
            height = img.height;
        } else if (!width || !height) {
            let p = img.width / img.height;
            width ? height = width / p : width = height * p;
        }
        if (align != 'left') {
            if (align == 'center') {
                x = (this.width - width) / 2;
            } else if (align == 'right') {
                x = this.width - width;
            }
        }
        if (vertical != 'top') {
            if (vertical == 'middle') {
                y = (this.height - height) / 2;
            } else if (vertical == 'bottom') {
                y = this.height - height;
            }
        }
        if (left) {
            x = x + left;
        } else if (right) {
            x = x - right;
        }
        if (top) {
            y = y + top;
        } else if (bottom) {
            y = y - bottom;
        }
        if (isCut) {
            ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
        } else {
            ctx.drawImage(img, x, y, width, height);
        }
    }
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
CanvasTools.prototype.line = function ({
                                           name = null,
                                           ctx = null,
                                           color = null,
                                           points = [],
                                           lineWidth = 1,
                                           lineJoin = 'round', //bevel|round|miter
                                           miterLimit = 0,
                                           lineCap = 'round', //butt|round|square
                                           shadowColor = 'black',
                                           shadowBlur = 0,
                                           shadowOffsetX = 0,
                                           shadowOffsetY = 0,
                                       }) {
    if (points.length) {
        let beginPoint = points.shift();
        if (!ctx) {
            ctx = this.canvasBox.getContext('2d');
            if (!name) {
                name = this.counter;
                this.counter += 1;
            }
            this.contexts[name] = {
                ctx,
                name,
                color,
                points,
                lineWidth,
                lineJoin,
                miterLimit,
                shadowColor,
                shadowBlur,
                shadowOffsetX,
                shadowOffsetY,
            }
        }
        let minX = 0, minY = 0, maxX = 0, maxY = 0;
        ctx.beginPath();
        ctx.lineJoin = lineJoin;
        ctx.miterLimit = miterLimit;
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.lineCap = lineCap;
        ctx.lineWidth = lineWidth;
        if (typeof beginPoint == 'object') {
            maxX = minX = beginPoint[0];
            maxY = minY = beginPoint[1];
            ctx.moveTo(beginPoint[0], beginPoint[1]);
        } else {
            maxX = maxY = minX = minY = beginPoint;
            ctx.moveTo(beginPoint, beginPoint);
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
                ctx.lineTo(point[0], point[1])
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
                ctx.lineTo(point, point)
            }
        })
        if (color) {
            if (typeof color == 'object') {
                let r = Math.sqrt(Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)) / 2;
                // console.log('r', r, maxY, minY, maxX, minX, color)
                color = this.createGradient(ctx, {
                    color: color.values,
                    angle: color.angle ? color.angle : 0,
                    scale: color.scale ? color.scale : 1,
                }, minX + (maxX - minX) / 2, minY + (maxY - minY) / 2, r)
            }
            ctx.strokeStyle = color;
        }

        ctx.stroke();
    }
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
CanvasTools.prototype.addText = function ({
                                              name = null,
                                              text,
                                              ctx = null,
                                              color = 'black',
                                              align = 'left',
                                              vertical = 'top',
                                              font = '1rem 黑体 bolder',
                                              textAlign = 'left',
                                              textBaseline = 'top',
                                              top = false,
                                              bottom = false,
                                              left = false,
                                              right = false,
                                              isStroke = false,
                                              maxWidth = 0,
                                              colorType = 'liner',
                                              colorScale = 1,
                                              shadowColor = 'black',
                                              shadowBlur = 0,
                                              shadowOffsetX = 0,
                                              shadowOffsetY = 0,
                                          }) {
    let x = 0, y = 0, r = 0;
    if (!text) {
        throw new Error('未设置文本');
    }
    if (align == 'right') {
        x = this.width;
        textAlign = 'right';
    } else if (align == 'center') {
        x = (this.width) / 2;
        textAlign = 'center';
    }
    if (vertical == 'middle') {
        y = this.height / 2;
        textBaseline = 'middle';
    } else if (vertical == 'bottom') {
        y = this.height;
        textBaseline = 'bottom';
    }
    if (top) {
        y = y + top;
    } else if (bottom) {
        y = y - bottom;
    }
    if (left) {
        x = x + left;
    } else if (right) {
        x = x - right;
    }
    if (!ctx) {
        ctx = this.canvasBox.getContext('2d');
        if (!name) {
            name = this.counter;
            this.counter += 1;
        }
        this.contexts[name] = {
            name,
            text,
            ctx,
            color,
            align,
            vertical,
            font,
            textAlign,
            textBaseline,
            top,
            bottom,
            left,
            right,
            isStroke,
            maxWidth,
            colorType,
            colorScale,
            shadowColor,
            shadowBlur,
            shadowOffsetX,
            shadowOffsetY,
        }
    }
    ctx.beginPath();
    ctx.shadowBlur = shadowBlur;
    ctx.shadowColor = shadowColor;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;
    ctx.textBaseline = textBaseline;
    ctx.textAlign = textAlign;
    ctx.font = font;

    if (typeof color == 'object') {
        r = ctx.measureText(text).width;
        if (colorType == 'radial') {
            r = r / (color.values.length - 1 > 0 ? color.values.length - 1 : 1);
        }
        color = this.createGradient(ctx, {
            color: color.values,
            type: colorType,
            scale: colorScale,
        }, x, y, r)
    }
    if (isStroke) {
        ctx.strokeStyle = color;
        if (maxWidth > 0) {
            ctx.strokeText(text, x, y, maxWidth);
        } else {
            ctx.strokeText(text, x, y);
        }
    } else {
        ctx.fillStyle = color;
        if (maxWidth > 0) {
            ctx.fillText(text, x, y, maxWidth);
        } else {
            ctx.fillText(text, x, y);
        }
    }
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

CanvasTools.prototype.setBgImage = function ({
                                                 ctx,
                                                 bgImg,

                                             }) {
    var img = new Image();
    img.src = bgImg;
    window.onload = () => {
        var bg = ctx.createPattern(img, "no-repeat");//createPattern() 方法在指定的方向内重复指定的元素。
        ctx.fillStyle = bg;//fillStyle 属性设置或返回用于填充绘画的颜色、渐变或模式。
        // ctx.fillRect(0, 0, c.width, c.height);//绘制已填充矩形fillRect(左上角x坐标, 左上角y坐标, 宽, 高)
        ctx.fill();
    }
    return ctx;
}
/**
 * 添加一个圆圈，可带文本
 * @param name
 * @param r
 * @param sAngle
 * @param eAngle
 * @param counterclockwise
 * @param left
 * @param right
 * @param top
 * @param bottom
 * @param bgColor 可以为字符串，如'black'等代表颜色的单词或颜色进制码，
 *                也可以为对象，如{
 *                  color: ['red','yellow','black',], // 颜色集合
 *                  type:'radial', // 渐变类型（radial--放射状渐变， liner--线性渐变），默认liner
 *                  angle: 180, // 当type=liner时有效，倾斜角
 *                  scale:2, // 当type=radial时有效，伸缩倍数
 *                }
 * @param content 如： {
 *      text: '', //文本
 *      font: '', //文本样式
 *      textAlign: '', //文本水平位置
 *      textBaseLine: '', //文本垂直位置
 *      isStroke: true, //是否为非填充文本
 *      color: 'black',// 文本颜色，可以为对象，如：['red', 'yellow']
 * }
 * @param lineColor 可以为字符串，如'black'等代表颜色的字符串，
 *                  也可以为对象，如['red', 'yellow', 'green']
 * @returns {*}
 */
CanvasTools.prototype.addCircle = function ({
                                                name = null,
                                                r = 0,
                                                sAngle = 0,
                                                eAngle = 2 * Math.PI,
                                                counterclockwise = false,
                                                left = false,
                                                right = false,
                                                top = false,
                                                bottom = false,
                                                bgColor = 'white',
                                                content = {
                                                    text: '',
                                                    font: '',
                                                    textAlign: '',
                                                    textBaseLine: '',
                                                    isStroke: true,
                                                    color: 'black',
                                                    shadowColor: 'black',
                                                    shadowBlur: 0,
                                                    shadowOffsetX: 0,
                                                    shadowOffsetY: 0,
                                                },
                                                lineColor = 'red',
                                                shadowColor = 'black',
                                                shadowBlur = 0,
                                                shadowOffsetX = 0,
                                                shadowOffsetY = 0,
                                                bgImg = '',
                                                lineWidth = 5,
                                            }) {
    let ctx = this.canvasBox.getContext('2d'), x = r, y = r;
    let fn = (fillStyle, imgW, imgH) => {
        if (left || right) {
            if (left) {
                x = r + left;
            } else if (right) {
                x = this.width - r - right;
            }
        }
        if (top || bottom) {
            if (top) {
                y = r + top;
            } else if (bottom) {
                y = this.height - r - bottom;
            }
        }

        ctx.beginPath();
        // ctx.translate(x - r, y - r);
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = shadowColor;
        ctx.shadowOffsetX = shadowOffsetX;
        ctx.shadowOffsetY = shadowOffsetY;
        ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
        ctx.save();
        if (fillStyle === null) {
            ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
            typeof bgColor == 'object' ? bgColor = this.createGradient(ctx, {
                color: bgColor.values,
                angle: bgColor.angle ? bgColor.angle : 0,
                scale: bgColor.scale ? bgColor.scale : 1,
            }, x, y, r) : '';
            fillStyle = bgColor;
        } else {
            ctx.translate(x - imgW / 2, y - imgH / 2);
        }
        ctx.fillStyle = fillStyle;
        ctx.fill();
        ctx.restore();
        if (typeof lineColor == 'object') {
            lineColor = this.createGradient(ctx, {
                color: lineColor.values,
                angle: lineColor.angle ? lineColor.angle : 0,
                scale: lineColor.scale ? lineColor.scale : 1,
            }, x, y, r);
        }
        ctx.arc(x, y, r, sAngle, eAngle, counterclockwise);
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;
        ctx.stroke();
        if (!content.font) {
            content.font = '.8rem 黑体 bolder';
        }
        if (!content.textAlign) {
            content.textAlign = 'center';
        }
        if (!content.textBaseLine) {
            content.textBaseLine = 'middle';
        }
        if (!content.color) {
            content.color = 'black';
        }
        if (name === null || !name) {
            name = this.counter;
            this.counter += 1;
        }
        if (content.text) {
            this.addText({
                ctx,
                text: content.text,
                textAlign: content.textAlign,
                font: content.font,
                textBaseline: content.textBaseLine,
                isStroke: content.isStroke,
                color: content.color,
                left: x,
                top: y,
                shadowColor: content.shadowColor ? content.shadowColor : 'black',
                shadowBlur: content.shadowBlur ? content.shadowBlur : 0,
                shadowOffsetY: content.shadowOffsetY ? content.shadowOffsetY : 0,
                shadowOffsetX: content.shadowOffsetX ? content.shadowOffsetX : 0,
            })
        }
        this.contexts[name] = {
            ctx,
            x,
            y,
            r,
            left,
            right,
            top,
            bottom,
            sAngle,
            eAngle,
            counterclockwise,
            bgColor,
            lineColor,
            content,
            name,
            width: 2 * r,
            height: 2 * r,
            shadowColor,
            shadowBlur,
            shadowOffsetX,
            shadowOffsetY,
        };
    }
    if (bgImg) {
        let img = new Image();
        img.src = bgImg;
        img.onload = () => {
            let bg = ctx.createPattern(img, "no-repeat");
            fn.call(this, bg, img.width, img.height)
        }
    } else {
        fn.call(this, null)
    }
    return this;
}


let c = new CanvasTools({
    eleId: 'goodNews',
    bgColor: 'rgba(242, 242, 242, 1)',
});

c.addText({
    text: '喜报.No.89',
    color: [
        'red',
        'yellow',
        'green',
    ],
    align: 'center',
    vertical: 'middle',
    // shadowBlur:5
})
c.addImage({
    name: 'logo',
    imgUrl: '/images/static/lg.png',
    width: 150,
    align: 'center',
    top: 25,
    shadowBlur: 0,
});

c.addCircle({
    name: 'order',
    r: 50,
    right: 10,
    top: 10,
    bgImg: '/images/static/loading.png',
    bgColor: {
        values: [
            'blue',
            'yellow'
        ]
    },
    lineColor: {
        values: [
            'green',
            'yellow',
            'red',
        ]
    },
    content: {
        text: 'No.99',
        color: [
            'red',
        ],
        // shadowBlur: 5,
        // shadowColor: 'blue'
    },
    // shadowBlur: 15,
    // shadowColor: 'blue'
});


c.line({
    color: {
        values: [
            'rgba(115, 170, 229, 0)',
            'rgba(115, 170, 229, 1)',
        ],
        scale: 1,
    },
    points: [
        [170, 50],
        [650, 50]
    ],
    lineWidth: 3,
    lineJoin: 'miter',
    miterLimit: 5,
})
c.line({
    color: 'rgba(115, 170, 229, 1)',
    points: [
        [650, 50],
        [670, 90],
        [880, 90],
        [900, 50],
    ],
    lineWidth: 3,
    lineJoin: 'round',
    miterLimit: 1,
    lineCap: 'round',
})
c.line({
    color: {
        values: [
            'rgba(115, 170, 229, 1)',
            'rgba(115, 170, 229, 0)',
        ],
        scale: 1,
    },
    points: [
        [900, 50],
        [1380, 50]
    ],
    lineWidth: 3,
})
// c.onLoad();


c.addCircle({
    name: 'order',
    r: 150,
    right: 300,
    top: 300,
    bgImg: '/images/static/lock.png',
    bgColor: {
        values: [
            'blue',
            'yellow'
        ]
    },
    lineColor: {
        values: [
            'green',
            'yellow',
            'red',
        ]
    },
    content: {
        text: 'No.99',
        color: {
            values: [
                'red',
            ]
        },
        // shadowBlur: 5,
        // shadowColor: 'blue'
    },
    // shadowBlur: 15,
    // shadowColor: 'blue'
});

