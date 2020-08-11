/**
 * @category gfx
 */

import { GFXDescriptorSetLayout, IGFXDescriptorSetLayoutInfo } from '../descriptor-set-layout';

export class WebGL2DescriptorSetLayout extends GFXDescriptorSetLayout {

    public initialize (info: IGFXDescriptorSetLayoutInfo) {
        Array.prototype.push.apply(this._bindings, info.bindings);

        return true;
    }

    public destroy () {
        this._bindings.length = 0;
    }
}
