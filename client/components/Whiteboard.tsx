import React from 'react'
import Popover from '@mui/material/Popover'
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react'
import Grid from '@mui/material/Grid'
import { BsFillPenFill as PenIcon, BsEraserFill as EraserIcon } from 'react-icons/bs'
import { MdDeleteSweep as ClearIcon } from 'react-icons/md'
import { IoMdColorPalette } from 'react-icons/io'
import { Socket } from 'socket.io-client'
import { SocketContext } from 'context/SocketContext'

enum TOOL {
  PEN = 1,
  ERASER,
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

  const COLORS = React.useMemo(
    () => [
      '#000000', // Black
      '#dc2626', // Red
      '#ea580c', // Orange
      '#eab308', // Yellow
      '#16a34a', // Green
      '#0284c7', // Sky Blue
      '#2563eb', // Royal Blue
      '#7c3aed', // Purple
      '#db2777', // Pink
      '#78350f', // Brown
    ],
    []
  )
  const [activeColor, setActiveColor] = React.useState<string>(COLORS[0])
  const [brushWidth, setBrushWidth] = React.useState<number>(6)

  const handleSelectColor = React.useCallback((color: string) => {
    setActiveColor(color)
    setSelectedTool(TOOL.PEN)
    setColorAnchorEl(null)
  }, [])

  // Sync canvas changes over sockets
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

  // Clear the entire whiteboard
  const handleClearBoard = React.useCallback(() => {
    if (!editor?.canvas) return
    editor.canvas.clear()
    editor.canvas.backgroundColor = '#ffffff'
    editor.canvas.renderAll()
    handleCanvasChange()
  }, [editor?.canvas, handleCanvasChange])

  // Configure Pen vs Eraser, Color, and Brush Broadness
  React.useEffect(() => {
    if (!editor || !editor.canvas) return

    const canvas = editor.canvas
    canvas.isDrawingMode = true

    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushWidth
      // Eraser paints with white background color; Pen paints with activeColor
      canvas.freeDrawingBrush.color =
        selectedTool === TOOL.ERASER ? '#ffffff' : activeColor
    }
  }, [selectedTool, activeColor, brushWidth, editor?.canvas])

  const handleIncomingWhiteBoardData = React.useCallback(
    (data: any) => {
      const { action, value } = data.data
      if (action === 'WHITEBOARD_CHANGE' && editor?.canvas) {
        editor.canvas.loadFromJSON(value, () => {
          editor.canvas.renderAll()
        })
      }
    },
    [editor?.canvas]
  )

  React.useEffect(() => {
    if (!socket) return
    socket.on('whiteboard:data', handleIncomingWhiteBoardData)
    return () => {
      socket.off('whiteboard:data', handleIncomingWhiteBoardData)
    }
  }, [socket, handleIncomingWhiteBoardData])

  React.useEffect(() => {
    if (editor && editor.canvas) {
      editor.canvas.on('mouse:up', handleCanvasChange)
    }
    return () => {
      if (editor && editor.canvas) {
        editor.canvas.off('mouse:up', handleCanvasChange)
      }
    }
  }, [editor?.canvas, handleCanvasChange])

  return (
    <>
      <div className="mb-2 h-[70vh] w-full overflow-hidden rounded-md border border-gray-200 bg-white shadow-inner">
        <FabricJSCanvas className="h-full w-full" onReady={onReady} />
      </div>

      {/* Brush Broadness Panel */}
      <div className="mb-2 flex w-full flex-wrap items-center justify-center gap-4 rounded-lg bg-slate-700 p-3 text-xs text-gray-200 shadow-inner">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sky-400">
            {selectedTool === TOOL.ERASER ? 'Eraser Size:' : 'Pen Broadness:'}
          </span>
          <input
            type="range"
            min="2"
            max="50"
            value={brushWidth}
            onChange={(e) => setBrushWidth(Number(e.target.value))}
            className="h-1 w-40 cursor-pointer appearance-none rounded-lg bg-slate-500 accent-sky-400"
          />
          <span className="w-12 rounded bg-slate-800 px-2 py-0.5 text-center font-mono">
            {brushWidth}px
          </span>
        </div>
      </div>

      {/* Action Navigation Toolbar */}
      <div className="h-[5vh] w-full rounded-lg bg-slate-600 shadow-md">
        <div
          className="flex h-full w-full cursor-pointer items-center justify-evenly text-xl text-white"
          id="tools-container"
        >
          {/* Pen Tool */}
          <PenIcon
            title="Pen"
            onClick={() => setSelectedTool(TOOL.PEN)}
            className={`transition-all ${
              selectedTool === TOOL.PEN
                ? 'scale-110 text-sky-400'
                : 'hover:text-gray-300'
            }`}
          />

          {/* Eraser Tool */}
          <EraserIcon
            title="Eraser"
            onClick={() => setSelectedTool(TOOL.ERASER)}
            className={`transition-all ${
              selectedTool === TOOL.ERASER
                ? 'scale-110 text-sky-400'
                : 'hover:text-gray-300'
            }`}
          />

          {/* Color Palette Picker */}
          <div
            title="Choose Color"
            className="flex items-center justify-center rounded-full border border-white/40 p-1 shadow-sm transition-transform hover:scale-105"
            style={{ backgroundColor: activeColor }}
            onClick={(e) => setColorAnchorEl(e.currentTarget)}
          >
            <IoMdColorPalette className="text-lg text-white" />
          </div>

          {/* Clear Board Button */}
          <ClearIcon
            title="Clear Board"
            onClick={handleClearBoard}
            className="text-2xl transition-colors hover:text-red-400"
          />
        </div>
      </div>

      {/* Color Popover */}
      <Popover
        onClose={() => setColorAnchorEl(null)}
        open={Boolean(colorAnchorEl)}
        anchorEl={colorAnchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <div className="min-h-[60px] max-w-[230px] rounded-md border border-gray-100 bg-white p-3 shadow-lg">
          <Grid container spacing={1}>
            {COLORS.map((color) => (
              <Grid key={color} item>
                <div
                  onClick={() => handleSelectColor(color)}
                  className={`h-[35px] w-[35px] cursor-pointer rounded-md border transition-all hover:scale-110 ${
                    activeColor === color && selectedTool === TOOL.PEN
                      ? 'border-black ring-2 ring-sky-400'
                      : 'border-gray-300'
                  }`}
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
