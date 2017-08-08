
const width = 1200;
const height = 600;
const radius = 16;
var flagsConfig = undefined;
loadFlagsConfig(function(response) {
    // Parse JSON string into object
    flagsConfig = JSON.parse(response).styles;
});

const tooltip = d3.select("body")
                .append("div")
                .attr("id", "tooltip");

const canvas = d3.select("body")
    .append("canvas")
    .attr("width", width)
    .attr("height", height)
    .style("margin", "auto")
    .style("display", "block")
    .style("padding", "0")

const context = canvas.node().getContext("2d");

const simulation = d3.forceSimulation()
        .force( "x", d3.forceX( width/2 ) )
        .force( "y", d3.forceY( height/2 ) )  
        .force( "center", d3.forceCenter( width/2, height/2 ))
        .force( "collide" , d3.forceCollide(radius) )
        .force( "charge", d3.forceManyBody(radius).strength(-25) )
        .force( "link", d3.forceLink() );


d3.json("./misc/countris.json", function (err, graph) {
    if ( err ) throw err;

    function update() {
        context.clearRect(0, 0, width, height);

        context.beginPath();
        graph.links.forEach(drawLink);
        context.strokeStyle = "#aaa";
        context.stroke();

        context.beginPath();
        graph.nodes.forEach(drawNode);
        context.fill();
        context.strokeStyle = "#fff";
        context.stroke();
    }

    function dragsubject() {
        //return simulation.find(d3.event.x, d3.event.y, radius);
        const pos = d3.mouse(canvas.node());
        return simulation.find(pos[0], pos[1], radius);
    }

    function handleToolTip() {
        const subject = dragsubject();
        const pos = d3.mouse( d3.select("body").node() );
        if ( subject ) {
            d3.select("#tooltip")
            .style('top', d3.event.pageY + 5 + 'px')
            .style('left', d3.event.pageX + 5 + 'px')
            .style('opacity', 0.8)
            .html(subject.country);
        }   
        else {
            d3.select("#tooltip")
            .style('opacity', 0)
        }
    }

    simulation.nodes( graph.nodes )
        .on("tick", update)
        .force("link").links(graph.links);

    d3.select(canvas.node())
        .call(d3.drag()
            .container(canvas.node())
            .subject(dragsubject)
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    d3.select(canvas.node())
        .on( "mousemove", handleToolTip);
});



function drawLink(d) {
    context.moveTo(d.source.x, d.source.y);
    context.lineTo(d.target.x, d.target.y);
}

function drawNode(d) {
    const dX = +d.x - 16/2;
    const dY = +d.y - 11/2;
    if ( !flagsConfig["flag_flag_" + d.code] ) {
        throw Error("Flag code not found: "+ d.code );
    }
    const pos = flagsConfig["flag_flag_" + d.code]["background-position"].split(" ");
    const sX = (-1)*parseInt(pos[0]);
    const sY = (-1)*parseInt(pos[1]);
    //void ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
    //context.rect( d.x - 16/2, d.y - 11/2, 16, 11);
    const image = new Image(); // HTML5 Constructor
    image.src = "./misc/flags.png";
    image.alt = d.country;

    context.drawImage(  image,
        sX, sY, 16, 11,
        dX, dY, 16, 11,
    );
    
    //context.stroke();
}


function dragstarted() {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d3.event.subject.fx = d3.event.subject.x;
    d3.event.subject.fy = d3.event.subject.y;
    d3.select("#tooltip")
        .style('opacity', 0);
}

function dragged() {
    d3.event.subject.fx = d3.event.x;
    d3.event.subject.fy = d3.event.y;
}

function dragended() {
    if (!d3.event.active) simulation.alphaTarget(0);
    d3.event.subject.fx = null;
    d3.event.subject.fy = null;
}


function loadFlagsConfig(callback) {   

    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', './misc/flags.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);  
}

