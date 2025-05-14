"use client";
import { useEffect, useState } from "react";
import generate from 'generate-maze';
import sillyName from 'sillyname';
import stringHash from 'string-hash';
import Rand from 'rand-seed';



export type CellType =  "L" | "I" | "T" | 'X' | 'P';

export const SINK = 2; 
export const SOURCE = 1; 
export type Cell = {
  kind: CellType,
  rotation: number,
  sinkOrSource: 0 | 1 | 2
  connected: boolean
};

const centerColors = ['black', 'blue', 'red']

const CellX = (props: Cell) => (
  <>
    <rect x={1} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? '#afa' : centerColors[props.sinkOrSource]
      }}/>

    <rect x={1} y={2} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? '#afa' : 'black',  
    }}/>
  </>
)

const CellL = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? '#afa' : 'black',  
      }}
    ></rect>

    <rect x={1} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? '#afa' : centerColors[props.sinkOrSource] 
      }}
    ></rect>

    <rect x={2} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? '#afa' : 'black',  
      }}
    ></rect>
  </>
)

const CellI = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} 
    style={{
      stroke: 'white',
      strokeWidth: 0.1,
      fill: props.connected ? '#afa' : 'black',  
    }}
    ></rect>

    <rect x={1} y={1} width={1} height={1} 
    style={{
      stroke: 'white',
      strokeWidth: 0.1,
      fill: props.connected ? '#afa' : centerColors[props.sinkOrSource] 
    }}
    ></rect>

    <rect x={1} y={2} width={1} height={1} 
    style={{
      stroke: 'white',
      strokeWidth: 0.1,
      fill: props.connected ? '#afa' : 'black',  
    }}
    ></rect>
  </>
)

const CellT = (props: Cell) => (
  <>
        <rect x={0} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>

        <rect x={1} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : centerColors[props.sinkOrSource]
          }}
        ></rect>

        <rect x={2} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>

        <rect x={1} y={2} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>
  </>
)

const CellP = (props: Cell) => (
  <>

        <rect x={1} y={0} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>
        <rect x={0} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>

        <rect x={1} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : centerColors[props.sinkOrSource] 
          }}
        ></rect>

        <rect x={2} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>

        <rect x={1} y={2} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? '#afa' : 'black',  
          }}
        ></rect>
  </>
)

const CellView = {
  I: CellI,
  L: CellL,
  T: CellT,
  X: CellX,
  P: CellP
} as unknown as Record<CellType, React.FC<Cell>>;

const CellComponent = (props: Cell) => {
  const producer = props.sinkOrSource == SOURCE
  const consumer = props.sinkOrSource == SINK
  const fill = producer 
    ? 'blue' 
    : consumer 
      ? 'purple' 
      : 'white';

  const style= {
    width: '100%',
    height: '100%',
    transition: '0.2s ease-in all', 
    display: 'inline-block',
    transform: `rotate(${props.rotation*90}deg)`
  };

  const Component = CellView[props.kind];

  return (
    <svg viewBox="0 0 3 3" style={style}>
      <Component {...props} />
      <circle cx={1.5} cy={1.5} r={0.2} style={{fill}}/>
    </svg>
  );

}

function findCells(cells: Cell[][], sinkOrSource = SOURCE) {
  const producers = [] as [number, number][];
  
  
  cells.forEach( (row, y) => row.forEach( (cell, x) => {
    if( cell.sinkOrSource == sinkOrSource) {
      producers.push([x,y]);
    }
  }));

  return producers;
}

function findPossiblyConnected(cells: Cell[][], [x, y]: [number,number]): [number,number][] {
  const cell = cells?.[y]?.[x];

  if (!cell) {
    return []
  }


  switch(cell.kind.toUpperCase()) {
    case "L":
      switch(cell.rotation%4) {
        case 0: 
          return [
            [x, y-1],
            [x+1, y]
          ];
        case 1:
          return [
            [x, y+1],
            [x+1, y]
          ];
        case 2:
          return [
            [x-1, y],
            [x, y+1]
          ];
        case 3:
          return [
            [x-1, y],
            [x, y-1]
          ];
      }
    case "I":
      switch(cell.rotation%4) {
        case 0: 
          return [
            [x, y+1],
            [x, y-1]
          ];
        case 1:
          return [
            [x-1, y],
            [x+1, y]
          ];
        case 2:
          return [
            [x, y+1],
            [x, y-1]
          ];
        case 3:
          return [
            [x+1, y],
            [x-1, y]
          ];
      }
      case "T":
        switch(cell.rotation%4) {
          case 0: 
            return [
              [x-1, y],
              [x+1, y],
              [x, y+1],
            ];
          case 1:
            return [
              [x-1, y],
              [x, y-1],
              [x, y+1],
            ];
          case 2:
            return [
              [x-1, y],
              [x+1, y],
              [x, y-1],
            ];
          case 3:
            return [
              [x+1, y],
              [x, y-1],
              [x, y+1],
            ];
        }

        case "P":
          return [
            [x-1, y],
            [x+1, y],
            [x, y-1],
            [x, y+1],
          ];

    default:
    case "X": 
      switch(cell.rotation%4) {
        case 0: 
          return [
            [x, y+1],
          ];
        case 1:
          return [
            [x-1, y],
          ];
        case 2:
          return [
            [x, y-1],
          ];
        case 3:
          return [
            [x+1, y],
          ];
      }
  }
  return [];
}

function findConnected(cells: Cell[][], [x,y]: [number,number]) {
  return findPossiblyConnected(cells, [x,y]).filter( ([x1, y1]) => {
    const connectable = findPossiblyConnected(cells, [x1, y1]);
    return connectable?.find( ([x2, y2]) => `${x2}-${y2}` == `${x}-${y}` )
  }) as [number,number][]
}

function floodFill(cells: Cell[][]) {
  const todo = findCells(cells, 1);

  const connected = new Set<string>([])

  for (const [x, y] of todo) {
    if ( connected.has(`${x}-${y}`))
      continue;
    
    connected.add(`${x}-${y}`);

    const next = findConnected(cells, [x,y]);
    next.forEach(x => {
      todo.push(x); 
    })
  }
  
  return connected;
}

function validateGame(cells: Cell[][]) {

  const connected = floodFill(cells);
  const consumers = findCells(cells, SINK);

  const done = consumers.every( ([x, y]) => connected.has(`${x}-${y}`));
  return {
    done,
    cells,
    connected
  }
}

function shuffle<T>(rand: Rand, arr: T[]): T[] {
  
  return arr.toSorted(() => rand.next() - 0.5);
}

function randomPoint(rand: Rand, n:number) {
  return [Math.floor(rand.next()*n), Math.floor(rand.next()*n)]
}

export function generateRandomGame(seed: number, size: number, inputs: number, outputs = 1) {

  const rand = new Rand(seed.toString());
  
  const maze = generate(size, size, true, seed)
    .map(row => row.map(c=>({
      ...c, 
      edges: +!c.bottom + +!c.left + +!c.right + +!c.top
    })));

  console.log({maze})
  const sinksArray = 
    shuffle(rand, maze
      .flatMap(x => x))
      .sort( (a,b) => a.edges - b.edges)
      .slice(0, inputs);


  const sinks = new Set(sinksArray.map(n=>`${n.x}-${n.y}`));


  const sources = new Set<string>([]);

  while (sources.size < outputs) {
    const [x,y] = randomPoint(rand,size);
    if (!sinks.has(`${x}-${y}`)) {
      sources.add(`${x}-${y}`);
    }
  }

  return maze.map( row => row.map(c => {
    const isSink = sinks.has(`${c.x}-${c.y}`);
    const isSource = sources.has(`${c.x}-${c.y}`);
    let kind = 'P';

    switch (c.edges) {
      case 1: 
        kind = 'X'; 
        break;
      case 3:
        kind = 'T'
        break;
      case 2:
        kind = c.left == c.right
          ? 'I'
          : 'L'
        break;
    }

    return {
      cell:c,
      kind,
      sinkOrSource: +isSink * 2 + +isSource, 
      rotation: 0,
      connected: isSource
    }
  })) as Cell[][]
  
  
}

function getSeedFromURL() {
  if(typeof window == 'undefined') {
    return {level:15, name: 'server-side'}
  }
  const [level, ...parts] = window.location.hash.split('#').at(-1)?.split('-') || [15, sillyName().split(' ')];
  const name = parts.join('-');

  console.log({level,name});
  return {
    level: level != '' ? level : 15, 
    name: name != '' ? name : sillyName()
  }
}


export function generateGame (n = 15, name = "server") {
  const seed = stringHash(name);
  const size = Math.floor(n/3);
  const inputs = size + Math.floor(size/2)*(n%3);
  console.log({seed, n, size, inputs})
  const game = generateRandomGame(seed, size, inputs);
  return validateGame(game);
}

function Grid() {
  const [{level, name}, setSettings] = useState(getSeedFromURL);

  const [game, setGame] = useState(() => generateGame(+level, name));

  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);

  const setNewLocation = (level: number, name = sillyName()) => {
    window.location.hash = `${level}-${name.replace(/ /g,'-')}`;
    setSettings({level, name});
  }

  useEffect(()=>{
    const h = setInterval(()=>setTime(t=>t+1), 1000);
    return () => clearInterval(h);
  }, []);

  useEffect(()=>{
    setGame(generateGame(+level, name));
  }, [level, name]);

  useEffect(()=>{
    if (game.done) {
      setTime(0);
      setMoves(0);
      setNewLocation(+level);
    }
  },[level, game.done])

  
  return (
    <div className="max-w-md" style={{display: 'flex', margin:'auto',flexDirection:'column'}}>

      
      <div style={{display:'flex', justifyContent:'space-between'}}>
        <button onClick={()=>{
          setMoves(0);
          setNewLocation(+level);
          setTime(0);  
        }}>New Game</button>

        <label> Difficulty: {level}
          <input type="range" value={level} min={15} max={60} step={1} onChange={(e)=>{
            const nextLevel = Math.max(15, +e.target.value);
            setNewLocation(nextLevel);
            setMoves(0);
            setTime(0);  
          }} /></label>
        </div>


      <div>
        <table cellSpacing="0" cellPadding="0" style={{ flex:0, borderSpacing:0, borderCollapse: 'collapse', border:'none' }}>
          <tbody>
            {game.cells.map( (row,y) => 
              <tr style={{margin:0,padding:0, }} key={y}>{
                row.map( (cell, x) => 
                  <td style={{margin:0,padding:0, border:'solid 1px black', }}   key={x} onClick={()=>{

                    const newRow = game.cells[y].with(x, {
                      ...game.cells[y][x],
                      rotation: (game.cells[y][x].rotation + 1)
                    } as Cell);
                    const newCells = game.cells.with(y, newRow);
                    setGame(validateGame(newCells));
                    setMoves(moves+1);
                  }}>
                    <CellComponent {...cell} connected={game.connected.has(`${x}-${y}`)} />
                </td>
              )}</tr>
            )}</tbody>
        </table>
      </div>

      <div style={{display:'flex', justifyContent:'space-between'}}>      
        <div>time: {time}s</div>
        <div>moves: {moves}</div>
      </div>

      <div> connect green pipes to red sinks; Click a pipe to rotate</div>






   </div>
  );
}


export function Game() {
  return (
    <div>
      <Grid/>
    </div>
  );
}