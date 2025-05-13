"use client";
import dedent from "dedent";
import { useState } from "react";


export type CellType =  "L" | "I" | "T" | "l" | "i" | "t" | 'X';

export type Cell = {
  kind: CellType,
  rotation: number,
  connected: boolean
};


const CellX = (props: Cell) => (
  <>
    <rect x={1} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? 'green' : 'red',  
      }}/>

    <rect x={1} y={2} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? 'green' : 'black',  
    }}/>
  </>
)

const CellL = (props: Cell) => (
  <>
    <rect x={1} y={0} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? 'green' : 'black',  
      }}
    ></rect>

    <rect x={1} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? 'green' : 'black',  
      }}
    ></rect>

    <rect x={2} y={1} width={1} height={1} 
      style={{
        stroke: 'white',
        strokeWidth: 0.1,
        fill: props.connected ? 'green' : 'black',  
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
      fill: props.connected ? 'green' : 'black',  
    }}
    ></rect>

    <rect x={1} y={1} width={1} height={1} 
    style={{
      stroke: 'white',
      strokeWidth: 0.1,
      fill: props.connected ? 'green' : 'black',  
    }}
    ></rect>

    <rect x={1} y={2} width={1} height={1} 
    style={{
      stroke: 'white',
      strokeWidth: 0.1,
      fill: props.connected ? 'green' : 'black',  
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
            fill: props.connected ? 'green' : 'black',  
          }}
        ></rect>

        <rect x={1} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? 'green' : 'black',  
          }}
        ></rect>

        <rect x={2} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? 'green' : 'black',  
          }}
        ></rect>

        <rect x={1} y={1} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? 'green' : 'black',  
          }}
        ></rect>

        <rect x={1} y={2} width={1} height={1} 
          style={{
            stroke: 'white',
            strokeWidth: 0.1,
            fill: props.connected ? 'green' : 'black',  
          }}
        ></rect>
  </>
)

const CellView = {
  I: CellI,
  i: CellI,
  L: CellL,
  l: CellL,
  T: CellT,
  t: CellT,
  X: CellX
} as unknown as Record<CellType, React.FC<Cell>>;

const CellComponent = (props: Cell) => {
  const producer = 'LIT'.split('').includes(props.kind);
  const consumer = 'X' == props.kind;
  const fill = producer 
    ? 'blue' 
    : consumer 
      ? 'orange' 
      : 'white';

  const style= {
    width: '5rem',
    height: '5rem',
    transition: '0.2s ease-in all', 
    display: 'inline-block',
    transform: `rotate(${props.rotation*90}deg)`
  };

  const Component = CellView[props.kind];

  return (
    <svg viewBox="0 0 3 3" style={style}>
      <Component {...props} />
      <circle cx={1.5} cy={1.5} r={0.1} style={{fill}}/>
    </svg>
  );

}

const game1 = dedent`
  LiiXX
  tiiil
  lttiX
  XiliX
  ltiiX  
`.split('\n').map(row=> row.split('')) as CellType[][];


const game2 = dedent`
  IXlXtil
  lttXllX
  Xlliltl
  iltttlX
  tlllXiX
  iXtiiii
  lXlilll  
`.split('\n').map(row=> row.split('')) as CellType[][];


const games = [game1,game2];

function findCells(cells: Cell[][], kind = ['L','I','T']) {
  const producers = [] as [number, number][];
  
  
  cells.forEach( (row, y) => row.forEach( (cell, x) => {
    if( kind.includes(cell.kind)) {
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

  console.log({cell});

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
    console.log({p: [x,y], connectable});
    return connectable?.find( ([x2, y2]) => `${x2}-${y2}` == `${x}-${y}` )
  }) as [number,number][]
}

function floodFill(cells: Cell[][]) {
  const todo = findCells(cells, 'LIT'.split(''));

  console.log({todo});
  const connected = new Set<string>([])

  for (const [x, y] of todo) {
    if ( connected.has(`${x}-${y}`))
      continue;
    
    connected.add(`${x}-${y}`);

    const next = findConnected(cells, [x,y]);
    console.log({next});
    next.forEach(x => {
      todo.push(x); 
    })
  }
  
  return connected;
}

function validateGame(cells: Cell[][]) {

  const connected = floodFill(cells);
  const consumers = findCells(cells, ['X']);

  const done = consumers.every( ([x, y]) => connected.has(`${x}-${y}`));
  return {
    done,
    cells,
    connected
  }
}


export function generateGame (i: number) {
  const game = games[i%games.length].map(row => row.map(k => ({
    kind: k,
    rotation: 0,
    connected: false,
  }))) as Cell[][];

  return validateGame(game);
}

function Grid() {
  const [level, setLevel] = useState(0);
  const [game,setGame] = useState(generateGame(level));
  const [moves, setMoves] = useState(0);

  
  return (
    <div>
      <table cellSpacing="0" cellPadding="0" style={{ borderSpacing:0, borderCollapse: 'collapse', border:'none' }}>
        <tbody>
          {game.cells.map( (row,y) => 
            <tr style={{margin:0,padding:0, }} key={y}>{
              row.map( (cell, x) => 
                <td style={{margin:0,padding:0, border:'solid 1px black', width:'5rem', height:'5rem'}}   key={x} onClick={()=>{

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
      <div> connect green pipes to red sinks; Click a pipe to rotate</div>
      <div> complete: {game.done? 'true' : 'false'}</div>
      <div>moves: {moves}</div>
      <button onClick={()=>{
        const next = (level+1) % games.length;
        setLevel(next)
        setMoves(0);
        setGame(generateGame(next))  
      }}>Next Level</button>
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