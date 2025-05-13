declare module 'generate-maze' {
  export default function generate(w:number, h: number, close: boolean, seed: number)
    : {
      x: number, 
      y: number,
      left: boolean,
      right: boolean 
      top:boolean, 
      bottom: boolean
    }[][]

}