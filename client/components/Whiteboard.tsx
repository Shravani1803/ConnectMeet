import React from 'react'
import Popover from '@mui/material/Popover'
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react'
import Grid from '@mui/material/Grid'
import { BsFillPenFill as PenIcon, BsSquare as SquareIcon, BsTriangle as TriangleIcon } from 'react-icons/bs'
import { FaRegCircle } from 'react-icons/fa'
import { GiArrowCursor as GiCursor } from 'react-icons/gi'
import { IoMdColorPalette } from 'react-icons/io'
import { Socket } from 'socket.io-client'
import { SocketContext } from 'context/SocketContext'
import { fabric } from 'fabric'

enum TOOL {
  PEN = 1,
  SQUARE,
  CIRCLE,
  TRIANGLE,
  SELECT,
}

interface WhiteBoardProps {
  remoteSocketId?: string
}

const WhiteBoard: React.FC<WhiteBoardProps> = (props) => {
  const { remoteSocketId } = props
  const socket = React.useContext(SocketContext) as Socket | null
  
  const { editor, onReady } = useFabricJSEditor()
  const [selectedTool, setSelectedTool] = React.useState<TOOL>(TOOL.PEN)
  const [colorAnchorEl, setColorAnchorEl] = React.useState<HTMLDivElement | null>(null)

  const COLORS = React.useMemo(() => ['#000000', '#dc2626', '#65a30d', '#2563eb', '#c026d3'], [])
  const [activeColor, setActiveColor] = React.useState<string>(COLORS[0])

  // Iterator dimension values for user configuration
  const [customWidth, setCustomWidth] = React.useState<number>(100)
  const [customHeight, setCustomHeight] = React.useState<number>(100)

  const handleSelectColor = React.useCallback((color: string) => {
    setActiveColor(color)
    setColorAnchorEl(null)
  }, [])

  // Sync stroke and fill settings
  React.useEffect(() => {
    if (editor && editor.canvas) {
      if (editor.canvas.freeDrawingBrush) {
        editor.canvas.freeDrawingBrush.color = activeColor
        editor.canvas.freeDrawingBrush.width = 6
      }
      
      if (socket) {
        socket.emit('whiteboard:drawing', {
          action: 'COLOR_CHANGE',
          value: activeColor,
          to: remoteSocketId,
        })
      }
    }
  }, [activeColor, editor?.canvas, remoteSocketId, socket])

  // Shape generation engine using structural configuration dimensions
  React.useEffect(() => {
    if (!editor || !editor.canvas) return

    const canvas = editor.canvas
    const centerX = canvas.getWidth() / 2
    const centerY = canvas.getHeight() / 2

    const shapeStyle = {
      fill: 'transparent',
      stroke: activeColor,
      strokeWidth: 4,
      cornerColor: '#2563eb',
      cornerSize: 8,
      transparentCorners: false,
    }

    switch (selectedTool) {
      case TOOL.SELECT:
        canvas.isDrawingMode = false
        break

      case TOOL.PEN:
        canvas.isDrawingMode = true
        break

      case TOOL.CIRCLE:
        canvas.isDrawingMode = false
        const radiusValue = customWidth / 2
        const circle = new fabric.Circle({
          ...shapeStyle,
          radius: radiusValue,
          left: centerX - radiusValue,
          top: centerY - radiusValue,
        })
        canvas.add(circle)
        canvas.setActiveObject(circle)
        canvas.renderAll()
        handleCanvasChange()
        setSelectedTool(TOOL.SELECT) 
        break

      case TOOL.SQUARE:
        canvas.isDrawingMode = false
        const rect = new fabric.Rect({
          ...shapeStyle,
          width: customWidth,
          height: customHeight,
          left: centerX - (customWidth / 2),
          top: centerY - (customHeight / 2),
        })
        canvas.add(rect)
        canvas.setActiveObject(rect)
        canvas.renderAll()
        handleCanvasChange()
        setSelectedTool(TOOL.SELECT)
        break

      case TOOL.TRIANGLE:
        canvas.isDrawingMode = false
        const triangle = new fabric.Triangle({
          ...shapeStyle,
          width: customWidth,
          height: customHeight,
          left: centerX - (customWidth / 2),
          top: centerY - (customHeight / 2),
        })
        canvas.add(triangle)
        canvas.setActiveObject(triangle)
        canvas.renderAll()
        handleCanvasChange()
        setSelectedTool(TOOL.SELECT)
        break
    }
  }, [selectedTool, editor?.canvas])

  // Sync canvas movements over sockets
  const handleCanvasChange = React.useCallback(() => {
    if (!editor?.canvas) return
    const _json = editor.canvas.toJSON()
    if (socket) {
      socket.emit('whiteboard:drawing', {
        action: 'WHITEBOARD_CHANGE',
        value: _json,
        to: remoteSocketId,
      })
    }
  }, [editor?.canvas, remoteSocketId, socket])

  const handleIncomingWhiteBoardData = React.useCallback((data: any) => {
    const { action, value } = data.data
    if (action === 'WHITEBOARD_CHANGE' && editor?.canvas) {
      editor.canvas.loadFromJSON(value, () => {
        editor.canvas.renderAll()
      })
    }
  }, [editor?.canvas])

  React.useEffect(() => {
    if (!socket) return
    socket.on('whiteboard:data', handleIncomingWhiteBoardData)
    return () => {
      socket.off('whiteboard:data', handleIncomingWhiteBoardData)
    }
  }, [editor?.canvas, socket, handleIncomingWhiteBoardData])

  React.useEffect(() => {
    if (editor && editor.canvas) {
      editor.canvas.on('mouse:up', handleCanvasChange)
      editor.canvas.on('object:modified', handleCanvasChange)
    }
    return () => {
      if (editor && editor.canvas) {
        editor.canvas.off('mouse:up', handleCanvasChange)
        editor.canvas.off('object:modified', handleCanvasChange)
      }
    }
  }, [editor?.canvas, handleCanvasChange])

  return (
    <>
      <div className="mb-2 h-[70vh] w-full rounded-md bg-white overflow-hidden border border-gray-200 shadow-inner">
        <FabricJSCanvas className="h-full w-full" onReady={onReady} />
      </div>

      {/* Iterator Dimension Panel */}
      <div className="mb-2 w-full bg-slate-700 rounded-lg p-3 text-xs flex flex-wrap gap-4 items-center justify-center text-gray-200 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sky-400">Width / Diameter:</span>
          <input 
            type="range" 
            min="20" 
            max="400" 
            value={customWidth} 
            onChange={(e) => setCustomWidth(Number(e.target.value))}
            className="w-32 h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <span className="bg-slate-800 px-2 py-0.5 rounded font-mono w-10 text-center">{customWidth}px</span>
        </div>

        {selectedTool !== TOOL.CIRCLE && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-emerald-400">Height:</span>
            <input 
              type="range" 
              min="20" 
              max="400" 
              value={customHeight} 
              onChange={(e) => setCustomHeight(Number(e.target.value))}
              className="w-32 h-1 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <span className="bg-slate-800 px-2 py-0.5 rounded font-mono w-10 text-center">{customHeight}px</span>
          </div>
        )}
      </div>

      {/* Action Navigation Toolbar */}
      <div className="h-[5vh] w-full rounded-lg bg-slate-600 shadow-md">
        <div className="flex h-full w-full items-center justify-evenly text-white text-xl cursor-pointer" id="tools-container">
          <GiCursor 
            className={`transition-colors ${selectedTool === TOOL.SELECT ? 'text-sky-400 scale-110' : 'hover:text-gray-300'}`} 
            onClick={() => setSelectedTool(TOOL.SELECT)} 
          />
          <PenIcon 
            onClick={() => setSelectedTool(TOOL.PEN)} 
            className={`transition-colors ${selectedTool === TOOL.PEN ? 'text-sky-400 scale-110' : 'hover:text-gray-300'}`} 
          />
          <div 
            className="rounded-full p-1 flex items-center justify-center border border-white/40 shadow-sm transition-transform hover:scale-105" 
            style={{ backgroundColor: activeColor }} 
            onClick={(e) => setColorAnchorEl(e.currentTarget)}
          >
            <IoMdColorPalette className="text-white text-lg" />
          </div>
          <FaRegCircle 
            onClick={() => setSelectedTool(TOOL.CIRCLE)} 
            className={`transition-colors ${selectedTool === TOOL.CIRCLE ? 'text-sky-400 scale-110' : 'hover:text-gray-300'}`} 
          />
          <SquareIcon 
            onClick={() => setSelectedTool(TOOL.SQUARE)} 
            className={`transition-colors ${selectedTool === TOOL.SQUARE ? 'text-sky-400 scale-110' : 'hover:text-gray-300'}`} 
          />
          <TriangleIcon 
            onClick={() => setSelectedTool(TOOL.TRIANGLE)} 
            className={`transition-colors ${selectedTool === TOOL.TRIANGLE ? 'text-sky-400 scale-110' : 'hover:text-gray-300'}`} 
          />
        </div>
      </div>
      
      <Popover 
        onClose={() => setColorAnchorEl(null)} 
        open={Boolean(colorAnchorEl)} 
        anchorEl={colorAnchorEl} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} 
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <div className="min-h-[60px] max-w-[240px] rounded-md bg-white p-3 shadow-lg border border-gray-100">
          <Grid container spacing={1}>
            {COLORS.map((color) => (
              <Grid key={color} item>
                <div 
                  onClick={() => handleSelectColor(color)} 
                  className={`h-[35px] w-[35px] cursor-pointer rounded-md border transition-all hover:scale-110 ${activeColor === color ? 'border-black ring-2 ring-sky-300' : 'border-gray-300'}`} 
                  style={{ backgroundColor: color }} 
                />
              </Grid>
            ))}
          </Grid>
        </div>
      </Popover>
    </>
  )
}

export default WhiteBoard
