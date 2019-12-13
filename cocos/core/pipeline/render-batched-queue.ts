/**
 * @category pipeline
 */

import { GFXCommandBuffer } from '../gfx/command-buffer';
import { BatchedBuffer } from './batched-buffer';

/**
 * @zh
 * 渲染合批队列。
 */
export class RenderBatchedQueue {

    /**
     * @zh
     * 基于缓存数组的队列。
     */
    public queue = new Set<BatchedBuffer>();

    /**
     * 构造函数。
     * @param desc 渲染队列描述。
     */
    constructor () {
    }

    /**
     * @zh
     * 清空渲染队列。
     */
    public clear () {
        for (const batchedBuff of this.queue.values()) {
            batchedBuff.clear();
        }
        this.queue.clear();
    }

    /**
     * @zh
     * 记录命令缓冲。
     */
    public recordCommandBuffer (cmdBuff: GFXCommandBuffer) {
        for (const batchedBuffer of this.queue.values()) {
            const pso = batchedBuffer.pso;
            if (!pso) { continue; }
            cmdBuff.bindPipelineState(pso);
            cmdBuff.bindBindingLayout(pso.pipelineLayout.layouts[0]);
            for (let b = 0; b < batchedBuffer.batches.length; ++b) {
                const batch = batchedBuffer.batches[b];
                if (!batch.mergeCount) { continue; }
                for (let v = 0; v < batch.vbs.length; ++v) {
                    cmdBuff.updateBuffer(batch.vbs[v], batch.vbDatas[v].buffer);
                }
                cmdBuff.updateBuffer(batch.vbIdx, batch.vbIdxData.buffer);
                cmdBuff.updateBuffer(batchedBuffer.ubo, batch.uboData.view.buffer);
                cmdBuff.bindInputAssembler(batch.ia);
                cmdBuff.draw(batch.ia);
            }
        }
    }
}
