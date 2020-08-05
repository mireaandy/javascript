// app.ts

import * as PIXI from 'pixi.js'
import { FpsMeter } from './fps-meter';

function getRandom(min: number, max: number) 
{
    return Math.random() * (max - min) + min;
}

function getDistanceTwoPoints(pointA: PIXI.Point, pointB: PIXI.Point)
{
    return Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
}

function getLengthFromLawOfSines(oneSide: number, oneAngle: number, otherAngle: number)
{
    return (oneSide * Math.sin(otherAngle)) / Math.sin(oneAngle);
}

function getAreaHeron(AB: number, BC: number, CA: number)
{
    let halfPerim = (AB+CA+BC) / 2;
    return Math.sqrt(halfPerim * (halfPerim - AB) * (halfPerim - CA) * (halfPerim - BC));
}

interface EngineParams 
{
    containerId: string,
    canvasW: number,
    canvasH: number,
    fpsMax: number
}

interface ControlParams
{
    shapePerSecond: number,
    gravityValue: number
}

class Control
{
    public shapePerSecond: number;
    public gravityValue: number;
    public shapesOnCanvas: number;
    public surfaceOccupied: number;

    constructor(params: ControlParams)
    {
        this.gravityValue = params.gravityValue;
        this.shapePerSecond = params.shapePerSecond;
        this.shapesOnCanvas = 0;
        this.surfaceOccupied = 0;
    }
}

class Engine 
{
    public container: HTMLElement;
    public loader: PIXI.Loader;
    public renderer: PIXI.Renderer;
    public stage: PIXI.Container;
    public interactionManager: PIXI.interaction.InteractionManager;
    public fpsMax: number;
    public shapeInterval: any;
    
    constructor(params: EngineParams) 
    {
        this.loader = PIXI.Loader.shared;

        this.renderer = PIXI.autoDetectRenderer({
            width: params.canvasW,
            height: params.canvasH,
            antialias: true,
            transparent: true
        });

        this.stage = new PIXI.Container();
        this.stage.interactive = true;
        this.interactionManager = new PIXI.interaction.InteractionManager(this.renderer);
        this.fpsMax = params.fpsMax;
        this.shapeInterval = null;

        this.container = params.containerId ? document.getElementById(params.containerId) || document.body : document.body;
        this.container.appendChild(this.renderer.view);
    }

}

const engine = new Engine({
    containerId: 'game',
    canvasW: 800,
    canvasH: 450,
    fpsMax: 60
});

const control = new Control({
    shapePerSecond: 1,
    gravityValue: 1
});

let fpsMeter: FpsMeter;
let noOfShownShapes = document.getElementById("nOfShapes");
let surfaceOfShapes = document.getElementById("sAreaShapes");
let plusShapeSpeedButton = document.getElementById("plusShape")
let minusShapeSpeedButton = document.getElementById("minusShape")
let plusGravityValueButton = document.getElementById("plusGravity")
let minusGravityValueButton = document.getElementById("minusGravity")

window.onload = load;

function load() 
{
    create();
}

function create() 
{
    /* FPS */
    const fpsMeterItem = document.createElement('div');
    fpsMeterItem.classList.add('fps');
    engine.container.appendChild(fpsMeterItem);

    fpsMeter = new FpsMeter(() => {
        fpsMeterItem.innerHTML = 'FPS: ' + fpsMeter.getFrameRate().toFixed(2).toString();
    });

    setInterval(updateFPS, 1000.0 / engine.fpsMax);

    /* CONTROL BUTTONS */

    if (plusShapeSpeedButton)
    plusShapeSpeedButton.onclick = function() 
    {
        control.shapePerSecond += 0.1;
        clearInterval(engine.shapeInterval);
        engine.shapeInterval = setInterval(addShape, 1000.0 / control.shapePerSecond)
        console.log(control.shapePerSecond)
    }

    if (minusShapeSpeedButton)
    minusShapeSpeedButton.onclick = function() 
    {
        control.shapePerSecond = (control.shapePerSecond - 0.1) > 0.1 ? (control.shapePerSecond - 0.1) : 0.1;
        clearInterval(engine.shapeInterval);
        engine.shapeInterval = setInterval(addShape, 1000.0 / control.shapePerSecond)
        console.log(control.shapePerSecond)
    }

    if (plusGravityValueButton)
    plusGravityValueButton.onclick = function() 
    {
        control.gravityValue += 0.1;
        console.log(control.gravityValue)
    }

    if (minusGravityValueButton)
    minusGravityValueButton.onclick = function() 
    {
        control.gravityValue = (control.gravityValue - 0.1) > 0.1 ? (control.gravityValue - 0.1) : 0.1;
        console.log(control.gravityValue)
    }

    /* SHAPES */
    engine.shapeInterval = setInterval(addShape, 1000.0 / control.shapePerSecond)

    render();
}

function updateFPS() 
{
    fpsMeter.updateTime();
}

function render() 
{
    requestAnimationFrame(render);

    engine.stage.children.forEach( child =>
        {
        if(child instanceof PIXI.Graphics)
            {
                child.position.y += control.gravityValue;

                if (child.position.y - child.height > 450) 
                {
                    let area = child.name.split(",")[1];
                    child.destroy();
                    control.shapesOnCanvas--;
                    control.surfaceOccupied -= Number(area);
                }
            }
        });

    if(noOfShownShapes)
        noOfShownShapes.innerHTML = control.shapesOnCanvas.toString();

    if(surfaceOfShapes)
        surfaceOfShapes.innerHTML = Math.round(control.surfaceOccupied).toString() + " px^2";

    engine.renderer.render(engine.stage);
    fpsMeter.tick();
}

function addShape(mousePosition?: boolean) 
{
    let shapeGraphics = new PIXI.Graphics();

    shapeGraphics.interactive = true;
    shapeGraphics.buttonMode = true;

    let colour = '0x'+(Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0');

    shapeGraphics.beginFill(Number(colour));
    shapeGraphics.lineStyle(2, Number(colour), 1);

    let choice = getRandom(0, 4);

    switch (Math.floor(choice))
    {
        case 0:
            {
                let width = getRandom(50, 600)
                let height = getRandom(50, 400)

                if (mousePosition) 
                {
                    let point = engine.interactionManager.mouse.getLocalPosition(engine.stage);
                    shapeGraphics.drawRect(point.x, point.y, width, height);
                    control.shapesOnCanvas++;
                }
                else 
                {
                    shapeGraphics.drawRect(getRandom(0, 800 - width), -height - 1, width, height);
                    control.shapesOnCanvas++;
                }

                let area = width * height;
                shapeGraphics.name = "rectangle," + area.toString();
                control.surfaceOccupied += area;

                break;
            }
        case 1:
            {
                let radius = getRandom(50, 200);

                if (mousePosition) 
                {
                    let point = engine.interactionManager.mouse.getLocalPosition(engine.stage);
                    shapeGraphics.drawCircle(point.x, point.y, radius);
                }
                else 
                {
                    let possibleXCenter = getRandom(0, 400);
                    let xCenter = possibleXCenter - radius < 0 ? possibleXCenter + (possibleXCenter - (-radius)) : possibleXCenter;
                    shapeGraphics.drawCircle(xCenter, -radius - 1, radius);
                    control.shapesOnCanvas++;
                }

                let area = Math.PI * radius * radius;
                shapeGraphics.name = "circle," + area.toString();
                control.surfaceOccupied += area;

                break;
            }
        case 2:
            {
                let radius = getRandom(50, 200);
                let possibleXCenter = getRandom(0, 400);
                let xCenter = possibleXCenter - radius < 0 ? possibleXCenter + (possibleXCenter - (-radius)) : possibleXCenter;
                shapeGraphics.drawStar(xCenter, -radius - 1, 5, radius);

                let AC = getLengthFromLawOfSines(radius, 2.19911486, 0.628318531);
                let CO = getLengthFromLawOfSines(radius, 2.19911486, 0.314159265);

                let area = 10 * getAreaHeron(radius, AC, CO); // http://mathcentral.uregina.ca/QQ/database/QQ.09.06/s/ashley1.html - explicatii privind calculul ariei stelei
                shapeGraphics.name = "star," + area.toString();
                control.surfaceOccupied += area;

                control.shapesOnCanvas++;
                break;
            }
        case 3:
            {
                let pointA = new PIXI.Point(getRandom(50, 400), -getRandom(50, 600));
                let pointB = new PIXI.Point(getRandom(50, 400), -getRandom(50, 600));
                let pointC = new PIXI.Point(getRandom(50, 400), -getRandom(50, 600));
                shapeGraphics.drawPolygon([pointA, pointB, pointC]);
                
                let AB = getDistanceTwoPoints(pointA, pointB);
                let AC = getDistanceTwoPoints(pointA, pointC);
                let BC = getDistanceTwoPoints(pointB, pointC);

                let area = getAreaHeron(AB, AC, BC);
                shapeGraphics.name = "triangle," + area.toString();
                control.surfaceOccupied += area;

                control.shapesOnCanvas++;
                break;
            }
        default:
            break;
    }

    shapeGraphics.endFill();
    shapeGraphics.on("click", shapeClickEvent);

    engine.stage.addChild(shapeGraphics)
}

function shapeClickEvent(this: PIXI.Graphics)
{
    let area = this.name.split(",")[1];
    this.destroy();
    control.shapesOnCanvas --;
    control.surfaceOccupied -= Number(area);
}