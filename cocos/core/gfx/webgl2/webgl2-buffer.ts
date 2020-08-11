import { GFXBuffer, GFXBufferSource, IGFXBufferInfo, IGFXBufferViewInfo } from '../buffer';
import { GFXBufferFlagBit, GFXBufferUsageBit, GFXStatus } from '../define';
import {
    WebGL2CmdFuncCreateBuffer,
    WebGL2CmdFuncDestroyBuffer,
    WebGL2CmdFuncResizeBuffer,
    WebGL2CmdFuncUpdateBuffer,
} from './webgl2-commands';
import { WebGL2Device } from './webgl2-device';
import { IWebGL2GPUBuffer } from './webgl2-gpu-objects';

export class WebGL2Buffer extends GFXBuffer {

    get gpuBuffer (): IWebGL2GPUBuffer {
        return  this._gpuBuffer!;
    }

    private _gpuBuffer: IWebGL2GPUBuffer | null = null;

    public initialize (info: IGFXBufferInfo | IGFXBufferViewInfo): boolean {

        if ('buffer' in info) { // buffer view

            this._isBufferView = true;

            const buffer = info.buffer as WebGL2Buffer;

            this._usage = buffer.usage;
            this._memUsage = buffer.memUsage;
            this._size = this._stride = info.range;
            this._count = 1;
            this._flags = buffer.flags;

            this._gpuBuffer = {
                usage: this._usage,
                memUsage: this._memUsage,
                size: this._size,
                stride: this._stride,
                buffer: this._bufferView,
                indirects: [],
                glTarget: buffer.gpuBuffer.glTarget,
                glBuffer: buffer.gpuBuffer.glBuffer,
                glOffset: info.offset,
            };

        } else { // native buffer

            this._usage = info.usage;
            this._memUsage = info.memUsage;
            this._size = info.size;
            this._stride = Math.max(info.stride || this._size, 1);
            this._count = this._size / this._stride;
            this._flags = (info.flags !== undefined ? info.flags : GFXBufferFlagBit.NONE);

            if (this._usage & GFXBufferUsageBit.INDIRECT) {
                this._indirectBuffer = { drawInfos: [] };
            }

            if (this._flags & GFXBufferFlagBit.BAKUP_BUFFER) {
                this._bufferView = new Uint8Array(this._size);
                this._device.memoryStatus.bufferSize += this._size;
            }

            this._gpuBuffer = {
                usage: this._usage,
                memUsage: this._memUsage,
                size: this._size,
                stride: this._stride,
                buffer: this._bufferView,
                indirects: [],
                glTarget: 0,
                glBuffer: null,
                glOffset: 0,
            };

            if (info.usage & GFXBufferUsageBit.INDIRECT) {
                this._gpuBuffer.indirects = this._indirectBuffer!.drawInfos;
            }

            WebGL2CmdFuncCreateBuffer(this._device as WebGL2Device, this._gpuBuffer);

            this._device.memoryStatus.bufferSize += this._size;
        }

        this._status = GFXStatus.SUCCESS;
        return true;
    }

    public destroy () {
        if (this._gpuBuffer) {
            if (!this._isBufferView) {
                WebGL2CmdFuncDestroyBuffer(this._device as WebGL2Device, this._gpuBuffer);
                this._device.memoryStatus.bufferSize -= this._size;
            }
            this._gpuBuffer = null;
        }

        this._bufferView = null;
        this._status = GFXStatus.UNREADY;
    }

    public resize (size: number) {
        if (this._isBufferView) {
            console.warn('cannot resize buffer views!');
            return;
        }

        const oldSize = this._size;
        if (oldSize === size) { return; }

        this._size = size;
        this._count = this._size / this._stride;

        if (this._bufferView) {
            const oldView = this._bufferView;
            this._bufferView = new Uint8Array(this._size);
            this._bufferView.set(oldView);
            this._device.memoryStatus.bufferSize -= oldSize;
            this._device.memoryStatus.bufferSize += size;
        }

        if (this._gpuBuffer) {
            if (this._bufferView) {
                this._gpuBuffer.buffer = this._bufferView;
            }

            this._gpuBuffer.size = size;
            if (size > 0) {
                WebGL2CmdFuncResizeBuffer(this._device as WebGL2Device, this._gpuBuffer);
                this._device.memoryStatus.bufferSize -= oldSize;
                this._device.memoryStatus.bufferSize += size;
            }
        }
    }

    public update (buffer: GFXBufferSource, offset?: number, size?: number) {

        let buffSize: number;
        if (size !== undefined ) {
            buffSize = size;
        } else if (this._usage & GFXBufferUsageBit.INDIRECT) {
            buffSize = 0;
        } else {
            buffSize = (buffer as ArrayBuffer).byteLength;
        }
        if (this._bufferView && buffer !== this._bufferView.buffer) {
            const view = new Uint8Array(buffer as ArrayBuffer, 0, size);
            this._bufferView.set(view, offset);
        }

        WebGL2CmdFuncUpdateBuffer(
            this._device as WebGL2Device,
            this._gpuBuffer!,
            buffer,
            offset || 0,
            buffSize);
    }
}
