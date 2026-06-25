
document.addEventListener('DOMContentLoaded', () => {
  const assemblage = document.querySelector('.assemblage-container');
  if (!assemblage || typeof Matter === 'undefined') return;

  // Wait for fonts/images to load so bounding boxes are correct
  window.addEventListener('load', initPhysics);

  function initPhysics() {
    // 1. Setup Matter.js Engine
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Body = Matter.Body,
          Constraint = Matter.Constraint,
          Mouse = Matter.Mouse,
          MouseConstraint = Matter.MouseConstraint,
          Composite = Matter.Composite;

    const engine = Engine.create();
    engine.gravity.y = 1.0; // Gravity pulling down

    // 2. Read DOM elements
    const header = document.querySelector('.header-sign');
    const cards = document.querySelectorAll('.hanging-card');
    const philosophy = document.querySelector('.philosophy-sign');
    const svgOverlay = document.getElementById('physics-ropes');
    
    if (!header || cards.length < 4 || !philosophy || !svgOverlay) return;

    // Lock assemblage height so we can switch to absolute positioning without collapse
    const assemblageRect = assemblage.getBoundingClientRect();
    assemblage.style.height = `${assemblageRect.height}px`;

    // 3. Helper to create body from DOM
    const domBodies = [];
    
    function createBodyFromDOM(el, isStatic = false, massScale = 1) {
      const rect = el.getBoundingClientRect();
      const parentRect = assemblage.getBoundingClientRect();
      
      // Calculate local position relative to assemblage-container
      const x = rect.left - parentRect.left + (rect.width / 2);
      const y = rect.top - parentRect.top + (rect.height / 2);

      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        isStatic: isStatic,
        frictionAir: 0.005, // reduced from 0.05 to make them swing faster
        restitution: 0.2,
        density: 0.005 * massScale,
        collisionFilter: { group: -1 }, // Disable collisions between bodies
        render: { visible: false }
      });
      
      body.domElement = el;
      body.initialWidth = rect.width;
      body.initialHeight = rect.height;
      
      domBodies.push(body);
      Composite.add(engine.world, body);
      
      // Switch DOM element to absolute
      el.style.position = 'absolute';
      el.style.top = '0px';
      el.style.left = '0px';
      el.style.margin = '0px';
      
      return body;
    }

    // Create bodies
    const headerBody = createBodyFromDOM(header, false, 2);
    const card1 = createBodyFromDOM(cards[0], false, 1.5);
    const card2 = createBodyFromDOM(cards[1], false, 1.5);
    const card3 = createBodyFromDOM(cards[2], false, 1.5);
    const card4 = createBodyFromDOM(cards[3], false, 1.5);
    const philBody = createBodyFromDOM(philosophy, false, 3);

    // 4. Create Ropes (Constraints)
    const ropes = [];
    
    function addRope(bodyA, pointA, bodyB, pointB) {
      const p1x = bodyA ? bodyA.position.x + pointA.x : pointA.x;
      const p1y = bodyA ? bodyA.position.y + pointA.y : pointA.y;
      const p2x = bodyB ? bodyB.position.x + pointB.x : pointB.x;
      const p2y = bodyB ? bodyB.position.y + pointB.y : pointB.y;
      const dist = Math.hypot(p2x - p1x, p2y - p1y);

      const constraint = Constraint.create({
        bodyA: bodyA,
        pointA: pointA,
        bodyB: bodyB,
        pointB: pointB,
        stiffness: 1.0, // increased from 0.8 so ropes don't stretch like rubber bands
        damping: 0.1,
        length: dist // Dynamic length based on grid layout
      });
      ropes.push(constraint);
      Composite.add(engine.world, constraint);
      
      // Create SVG line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgOverlay.appendChild(line);
      constraint.svgLine = line;
    }

    // Ceiling to Header (2 ropes)
    const ceilingA = { x: headerBody.position.x - 200, y: headerBody.position.y - (headerBody.initialHeight/2) - 100 };
    const ceilingB = { x: headerBody.position.x + 200, y: headerBody.position.y - (headerBody.initialHeight/2) - 100 };
    
    addRope(null, ceilingA, headerBody, { x: -200, y: -headerBody.initialHeight/2 });
    addRope(null, ceilingB, headerBody, { x: 200, y: -headerBody.initialHeight/2 });

    // Header to Row 1
    addRope(headerBody, {x: -200, y: headerBody.initialHeight/2}, card1, {x: 0, y: -card1.initialHeight/2});
    addRope(headerBody, {x: 200, y: headerBody.initialHeight/2}, card2, {x: 0, y: -card2.initialHeight/2});

    // Row 1 to Row 2
    addRope(card1, {x: -100, y: card1.initialHeight/2}, card3, {x: -100, y: -card3.initialHeight/2});
    addRope(card1, {x: 100, y: card1.initialHeight/2}, card3, {x: 100, y: -card3.initialHeight/2});
    
    addRope(card2, {x: -100, y: card2.initialHeight/2}, card4, {x: -100, y: -card4.initialHeight/2});
    addRope(card2, {x: 100, y: card2.initialHeight/2}, card4, {x: 100, y: -card4.initialHeight/2});

    // Row 2 to Philosophy
    addRope(card3, {x: 0, y: card3.initialHeight/2}, philBody, {x: -200, y: -philBody.initialHeight/2});
    addRope(card4, {x: 0, y: card4.initialHeight/2}, philBody, {x: 200, y: -philBody.initialHeight/2});

    // 5. Mouse Interaction
    const mouse = Mouse.create(assemblage);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });
    Composite.add(engine.world, mouseConstraint);

    // Keep the mouse in sync with scrolling
    mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);

    // 6. Render Loop (Sync Physics to DOM & SVG)
    Matter.Events.on(engine, 'afterUpdate', () => {
      // Sync DOM elements
      for (let i = 0; i < domBodies.length; i++) {
        const body = domBodies[i];
        const el = body.domElement;
        // Translate from center coordinates
        const x = body.position.x - (body.initialWidth / 2);
        const y = body.position.y - (body.initialHeight / 2);
        el.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
      }

      // Sync SVG lines
      for (let i = 0; i < ropes.length; i++) {
        const c = ropes[i];
        if (!c.svgLine) continue;
        
        let p1x, p1y, p2x, p2y;
        
        if (c.bodyA) {
          p1x = c.bodyA.position.x + (c.pointA.x * Math.cos(c.bodyA.angle)) - (c.pointA.y * Math.sin(c.bodyA.angle));
          p1y = c.bodyA.position.y + (c.pointA.x * Math.sin(c.bodyA.angle)) + (c.pointA.y * Math.cos(c.bodyA.angle));
        } else {
          p1x = c.pointA.x;
          p1y = c.pointA.y;
        }
        
        if (c.bodyB) {
          p2x = c.bodyB.position.x + (c.pointB.x * Math.cos(c.bodyB.angle)) - (c.pointB.y * Math.sin(c.bodyB.angle));
          p2y = c.bodyB.position.y + (c.pointB.x * Math.sin(c.bodyB.angle)) + (c.pointB.y * Math.cos(c.bodyB.angle));
        } else {
          p2x = c.pointB.x;
          p2y = c.pointB.y;
        }

        c.svgLine.setAttribute('x1', p1x);
        c.svgLine.setAttribute('y1', p1y);
        c.svgLine.setAttribute('x2', p2x);
        c.svgLine.setAttribute('y2', p2y);
      }
      
      // Wind force
      if (Math.random() < 0.05) {
        const force = (Math.random() - 0.5) * 0.005;
        Body.applyForce(headerBody, headerBody.position, {x: force, y: 0});
      }
    });

    // 7. Start Engine
    Runner.run(Runner.create(), engine);

    // 8. Hook into flip to add physics impulse
    const flipCues = document.querySelectorAll('.flip-cue');
    flipCues.forEach(cue => {
      cue.addEventListener('click', () => {
        applyFlipImpulse();
      });
    });

    function applyFlipImpulse() {
      // Jolt each body slightly
      domBodies.forEach(body => {
        const torque = (Math.random() - 0.5) * 0.2;
        Body.setAngularVelocity(body, torque);
      });
    }
    
    // We also need to hook into the existing drag-to-flip in app.js
    // We can do this by observing the class mutation on assemblage
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
           applyFlipImpulse();
        }
      });
    });
    observer.observe(assemblage, { attributes: true });

  }
});
