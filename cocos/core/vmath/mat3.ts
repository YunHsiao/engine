/**
 * @category core/math
 */

import { mat4 } from './mat4';
import { quat } from './quat';
import { EPSILON } from './utils';
import { vec3 } from './vec3';

/**
 * @zh 三维矩阵
 */
// tslint:disable:one-variable-per-declaration
// tslint:disable-next-line:class-name
export class mat3 {

    /**
     * @zh 创建新的实例
     */
    public static create (m00 = 1, m01 = 0, m02 = 0, m03 = 0, m04 = 1, m05 = 0, m06 = 0, m07 = 0, m08 = 1) {
        console.warn('Obsolete Vmath API');
        return new mat3(m00, m01, m02, m03, m04, m05, m06, m07, m08);
    }

    /**
     * @zh 获得指定矩阵的拷贝
     */
    public static clone (a: mat3) {
        console.warn('Obsolete Vmath API');
        return new mat3(
            a.m00, a.m01, a.m02,
            a.m03, a.m04, a.m05,
            a.m06, a.m07, a.m08,
        );
    }

    /**
     * @zh 复制目标矩阵
     */
    public static copy<Out extends mat3> (out: Out, a: mat3) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00;
        out.m01 = a.m01;
        out.m02 = a.m02;
        out.m03 = a.m03;
        out.m04 = a.m04;
        out.m05 = a.m05;
        out.m06 = a.m06;
        out.m07 = a.m07;
        out.m08 = a.m08;
        return out;
    }

    /**
     * @zh 设置矩阵值
     */
    public static set (
        out: mat3,
        m00: number, m01: number, m02: number,
        m10: number, m11: number, m12: number,
        m20: number, m21: number, m22: number,
    ) {
        console.warn('Obsolete Vmath API');
        out.m00 = m00; out.m01 = m01; out.m02 = m02;
        out.m03 = m10; out.m04 = m11; out.m05 = m12;
        out.m06 = m20; out.m07 = m21; out.m08 = m22;
        return out;
    }

    /**
     * @zh 将目标赋值为单位矩阵
     */
    public static identity<Out extends mat3> (out: Out) {
        console.warn('Obsolete Vmath API');
        out.m00 = 1;
        out.m01 = 0;
        out.m02 = 0;
        out.m03 = 0;
        out.m04 = 1;
        out.m05 = 0;
        out.m06 = 0;
        out.m07 = 0;
        out.m08 = 1;
        return out;
    }

    /**
     * @zh 转置矩阵
     */
    public static transpose<Out extends mat3> (out: Out, a: mat3) {
        console.warn('Obsolete Vmath API');
        // If we are transposing ourselves we can skip a few steps but have to cache some values
        if (out === a) {
            const a01 = a.m01, a02 = a.m02, a12 = a.m05;
            out.m01 = a.m03;
            out.m02 = a.m06;
            out.m03 = a01;
            out.m05 = a.m07;
            out.m06 = a02;
            out.m07 = a12;
        } else {
            out.m00 = a.m00;
            out.m01 = a.m03;
            out.m02 = a.m06;
            out.m03 = a.m01;
            out.m04 = a.m04;
            out.m05 = a.m07;
            out.m06 = a.m02;
            out.m07 = a.m05;
            out.m08 = a.m08;
        }

        return out;
    }

    /**
     * @zh 矩阵求逆
     */
    public static invert<Out extends mat3> (out: Out, a: mat3) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02,
            a10 = a.m03, a11 = a.m04, a12 = a.m05,
            a20 = a.m06, a21 = a.m07, a22 = a.m08;

        const b01 = a22 * a11 - a12 * a21;
        const b11 = -a22 * a10 + a12 * a20;
        const b21 = a21 * a10 - a11 * a20;

        // Calculate the determinant
        let det = a00 * b01 + a01 * b11 + a02 * b21;

        if (!det) {
            return null;
        }
        det = 1.0 / det;

        out.m00 = b01 * det;
        out.m01 = (-a22 * a01 + a02 * a21) * det;
        out.m02 = (a12 * a01 - a02 * a11) * det;
        out.m03 = b11 * det;
        out.m04 = (a22 * a00 - a02 * a20) * det;
        out.m05 = (-a12 * a00 + a02 * a10) * det;
        out.m06 = b21 * det;
        out.m07 = (-a21 * a00 + a01 * a20) * det;
        out.m08 = (a11 * a00 - a01 * a10) * det;
        return out;
    }

    /**
     * @zh 矩阵行列式
     */
    public static determinant (a: mat3) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02,
            a10 = a.m03, a11 = a.m04, a12 = a.m05,
            a20 = a.m06, a21 = a.m07, a22 = a.m08;

        return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
    }

    /**
     * @zh 矩阵乘法
     */
    public static multiply<Out extends mat3> (out: Out, a: mat3, b: mat3) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02,
            a10 = a.m03, a11 = a.m04, a12 = a.m05,
            a20 = a.m06, a21 = a.m07, a22 = a.m08;

        const b00 = b.m00, b01 = b.m01, b02 = b.m02;
        const b10 = b.m03, b11 = b.m04, b12 = b.m05;
        const b20 = b.m06, b21 = b.m07, b22 = b.m08;

        out.m00 = b00 * a00 + b01 * a10 + b02 * a20;
        out.m01 = b00 * a01 + b01 * a11 + b02 * a21;
        out.m02 = b00 * a02 + b01 * a12 + b02 * a22;

        out.m03 = b10 * a00 + b11 * a10 + b12 * a20;
        out.m04 = b10 * a01 + b11 * a11 + b12 * a21;
        out.m05 = b10 * a02 + b11 * a12 + b12 * a22;

        out.m06 = b20 * a00 + b21 * a10 + b22 * a20;
        out.m07 = b20 * a01 + b21 * a11 + b22 * a21;
        out.m08 = b20 * a02 + b21 * a12 + b22 * a22;
        return out;
    }

    /**
     * @zh 矩阵乘法
     */
    public static mul (out, a, b) {
        console.warn('Obsolete Vmath API');
        return mat3.multiply(out, a, b);
    }

    /**
     * @zh 在给定矩阵变换基础上加入新位移变换
     */
    public static translate<Out extends mat3> (out: Out, a: mat3, v: vec3) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02,
            a10 = a.m03, a11 = a.m04, a12 = a.m05,
            a20 = a.m06, a21 = a.m07, a22 = a.m08;
        const x = v.x, y = v.y;

        out.m00 = a00;
        out.m01 = a01;
        out.m02 = a02;

        out.m03 = a10;
        out.m04 = a11;
        out.m05 = a12;

        out.m06 = x * a00 + y * a10 + a20;
        out.m07 = x * a01 + y * a11 + a21;
        out.m08 = x * a02 + y * a12 + a22;
        return out;
    }

    /**
     * @zh 在给定矩阵变换基础上加入新缩放变换
     */
    public static scale<Out extends mat3> (out: Out, a: mat3, v: vec3) {
        console.warn('Obsolete Vmath API');
        const x = v.x, y = v.y;

        out.m00 = x * a.m00;
        out.m01 = x * a.m01;
        out.m02 = x * a.m02;

        out.m03 = y * a.m03;
        out.m04 = y * a.m04;
        out.m05 = y * a.m05;

        out.m06 = a.m06;
        out.m07 = a.m07;
        out.m08 = a.m08;
        return out;
    }

    /**
     * @zh 在给定矩阵变换基础上加入新旋转变换
     * @param rad 旋转弧度
     */
    public static rotate<Out extends mat3> (out: Out, a: mat3, rad: number) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02,
            a10 = a.m03, a11 = a.m04, a12 = a.m05,
            a20 = a.m06, a21 = a.m07, a22 = a.m08;

        const s = Math.sin(rad);
        const c = Math.cos(rad);

        out.m00 = c * a00 + s * a10;
        out.m01 = c * a01 + s * a11;
        out.m02 = c * a02 + s * a12;

        out.m03 = c * a10 - s * a00;
        out.m04 = c * a11 - s * a01;
        out.m05 = c * a12 - s * a02;

        out.m06 = a20;
        out.m07 = a21;
        out.m08 = a22;
        return out;
    }

    /**
     * @zh 根据指定四维矩阵计算三维矩阵
     */
    public static fromMat4<Out extends mat3> (out: Out, a: mat4) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00;
        out.m01 = a.m01;
        out.m02 = a.m02;
        out.m03 = a.m04;
        out.m04 = a.m05;
        out.m05 = a.m06;
        out.m06 = a.m08;
        out.m07 = a.m09;
        out.m08 = a.m10;
        return out;
    }

    /**
     * @zh 根据视口前方向和上方向计算矩阵
     * @param view 视口面向的前方向，必须归一化
     * @param up 视口的上方向，必须归一化，默认为 (0, 1, 0)
     */
    public static fromViewUp<Out extends mat3> (out: Out, view: vec3, up?: vec3) {
        console.warn('Obsolete Vmath API');
        if (vec3.sqrMag(view) < EPSILON * EPSILON) {
            mat3.identity(out);
            return out;
        }

        up = up || vec3.UNIT_Y;
        vec3.normalize(v3_1, vec3.cross(v3_1, up, view));

        if (vec3.sqrMag(v3_1) < EPSILON * EPSILON) {
            mat3.identity(out);
            return out;
        }

        vec3.cross(v3_2, view, v3_1);
        mat3.set(
            out,
            v3_1.x, v3_1.y, v3_1.z,
            v3_2.x, v3_2.y, v3_2.z,
            view.x, view.y, view.z,
        );

        return out;
    }

    /**
     * @zh 计算位移矩阵
     */
    public static fromTranslation<Out extends mat3> (out: Out, v: vec3) {
        console.warn('Obsolete Vmath API');
        out.m00 = 1;
        out.m01 = 0;
        out.m02 = 0;
        out.m03 = 0;
        out.m04 = 1;
        out.m05 = 0;
        out.m06 = v.x;
        out.m07 = v.y;
        out.m08 = 1;
        return out;
    }

    /**
     * @zh 计算缩放矩阵
     */
    public static fromScaling<Out extends mat3> (out: Out, v: vec3) {
        console.warn('Obsolete Vmath API');
        out.m00 = v.x;
        out.m01 = 0;
        out.m02 = 0;

        out.m03 = 0;
        out.m04 = v.y;
        out.m05 = 0;

        out.m06 = 0;
        out.m07 = 0;
        out.m08 = 1;
        return out;
    }

    /**
     * @zh 计算旋转矩阵
     */
    public static fromRotation<Out extends mat3> (out: Out, rad: number) {
        console.warn('Obsolete Vmath API');
        const s = Math.sin(rad), c = Math.cos(rad);

        out.m00 = c;
        out.m01 = s;
        out.m02 = 0;

        out.m03 = -s;
        out.m04 = c;
        out.m05 = 0;

        out.m06 = 0;
        out.m07 = 0;
        out.m08 = 1;
        return out;
    }

    /**
     * @zh 根据四元数旋转信息计算矩阵
     */
    public static fromQuat<Out extends mat3> (out: Out, q: quat) {
        console.warn('Obsolete Vmath API');
        const x = q.x, y = q.y, z = q.z, w = q.w;
        const x2 = x + x;
        const y2 = y + y;
        const z2 = z + z;

        const xx = x * x2;
        const yx = y * x2;
        const yy = y * y2;
        const zx = z * x2;
        const zy = z * y2;
        const zz = z * z2;
        const wx = w * x2;
        const wy = w * y2;
        const wz = w * z2;

        out.m00 = 1 - yy - zz;
        out.m03 = yx - wz;
        out.m06 = zx + wy;

        out.m01 = yx + wz;
        out.m04 = 1 - xx - zz;
        out.m07 = zy - wx;

        out.m02 = zx - wy;
        out.m05 = zy + wx;
        out.m08 = 1 - xx - yy;

        return out;
    }

    /**
     * @zh 计算指定四维矩阵的逆转置三维矩阵
     */
    public static inverseTransposeMat4<Out extends mat3> (out: Out, a: mat4) {
        console.warn('Obsolete Vmath API');
        const a00 = a.m00, a01 = a.m01, a02 = a.m02, a03 = a.m03,
            a10 = a.m04, a11 = a.m05, a12 = a.m06, a13 = a.m07,
            a20 = a.m08, a21 = a.m09, a22 = a.m10, a23 = a.m11,
            a30 = a.m12, a31 = a.m13, a32 = a.m14, a33 = a.m15;

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

        if (!det) {
            return null;
        }
        det = 1.0 / det;

        out.m00 = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out.m01 = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out.m02 = (a10 * b10 - a11 * b08 + a13 * b06) * det;

        out.m03 = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out.m04 = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out.m05 = (a01 * b08 - a00 * b10 - a03 * b06) * det;

        out.m06 = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out.m07 = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out.m08 = (a30 * b04 - a31 * b02 + a33 * b00) * det;

        return out;
    }

    /**
     * @zh 返回矩阵的字符串表示
     */
    public static str (a) {
        console.warn('Obsolete Vmath API');
        return `mat3(${a.m00}, ${a.m01}, ${a.m02}, ${a.m03}, ${a.m04}, ${a.m05}, ${a.m06}, ${a.m07}, ${a.m08})`;
    }

    /**
     * @zh 矩阵转数组
     * @param ofs 数组内的起始偏移量
     */
    public static array (out: IWritableArrayLike<number>, m: mat4, ofs = 0) {
        console.warn('Obsolete Vmath API');
        out[ofs + 0] = m.m00;
        out[ofs + 1] = m.m01;
        out[ofs + 2] = m.m02;
        out[ofs + 3] = m.m03;
        out[ofs + 4] = m.m04;
        out[ofs + 5] = m.m05;
        out[ofs + 6] = m.m06;
        out[ofs + 7] = m.m07;
        out[ofs + 8] = m.m08;

        return out;
    }

    /**
     * @zh 逐元素矩阵加法
     */
    public static add<Out extends mat3> (out: Out, a: mat3, b: mat3) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00 + b.m00;
        out.m01 = a.m01 + b.m01;
        out.m02 = a.m02 + b.m02;
        out.m03 = a.m03 + b.m03;
        out.m04 = a.m04 + b.m04;
        out.m05 = a.m05 + b.m05;
        out.m06 = a.m06 + b.m06;
        out.m07 = a.m07 + b.m07;
        out.m08 = a.m08 + b.m08;
        return out;
    }

    /**
     * @zh 逐元素矩阵减法
     */
    public static subtract<Out extends mat3> (out: Out, a: mat3, b: mat3) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00 - b.m00;
        out.m01 = a.m01 - b.m01;
        out.m02 = a.m02 - b.m02;
        out.m03 = a.m03 - b.m03;
        out.m04 = a.m04 - b.m04;
        out.m05 = a.m05 - b.m05;
        out.m06 = a.m06 - b.m06;
        out.m07 = a.m07 - b.m07;
        out.m08 = a.m08 - b.m08;
        return out;
    }

    /**
     * @zh 逐元素矩阵减法
     */
    public static sub<Out extends mat3> (out: Out, a: mat3, b: mat3) {
        console.warn('Obsolete Vmath API');
        return mat3.subtract(out, a, b);
    }

    /**
     * @zh 矩阵标量乘法
     */
    public static multiplyScalar<Out extends mat3> (out: Out, a: mat3, b: number) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00 * b;
        out.m01 = a.m01 * b;
        out.m02 = a.m02 * b;
        out.m03 = a.m03 * b;
        out.m04 = a.m04 * b;
        out.m05 = a.m05 * b;
        out.m06 = a.m06 * b;
        out.m07 = a.m07 * b;
        out.m08 = a.m08 * b;
        return out;
    }

    /**
     * @zh 逐元素矩阵标量乘加: A + B * scale
     */
    public static multiplyScalarAndAdd<Out extends mat3> (out: Out, a: mat3, b: mat3, scale: number) {
        console.warn('Obsolete Vmath API');
        out.m00 = a.m00 + (b.m00 * scale);
        out.m01 = a.m01 + (b.m01 * scale);
        out.m02 = a.m02 + (b.m02 * scale);
        out.m03 = a.m03 + (b.m03 * scale);
        out.m04 = a.m04 + (b.m04 * scale);
        out.m05 = a.m05 + (b.m05 * scale);
        out.m06 = a.m06 + (b.m06 * scale);
        out.m07 = a.m07 + (b.m07 * scale);
        out.m08 = a.m08 + (b.m08 * scale);
        return out;
    }

    /**
     * @zh 矩阵等价判断
     */
    public static exactEquals (a: mat3, b: mat3) {
        console.warn('Obsolete Vmath API');
        return a.m00 === b.m00 && a.m01 === b.m01 && a.m02 === b.m02 &&
            a.m03 === b.m03 && a.m04 === b.m04 && a.m05 === b.m05 &&
            a.m06 === b.m06 && a.m07 === b.m07 && a.m08 === b.m08;
    }

    /**
     * @zh 排除浮点数误差的矩阵近似等价判断
     */
    public static equals (a: mat3, b: mat3) {
        const a0 = a.m00, a1 = a.m01, a2 = a.m02, a3 = a.m03, a4 = a.m04, a5 = a.m05, a6 = a.m06, a7 = a.m07, a8 = a.m08;
        const b0 = b.m00, b1 = b.m01, b2 = b.m02, b3 = b.m03, b4 = b.m04, b5 = b.m05, b6 = b.m06, b7 = b.m07, b8 = b.m08;
        console.warn('Obsolete Vmath API');
        return (
            Math.abs(a0 - b0) <= EPSILON * Math.max(1.0, Math.abs(a0), Math.abs(b0)) &&
            Math.abs(a1 - b1) <= EPSILON * Math.max(1.0, Math.abs(a1), Math.abs(b1)) &&
            Math.abs(a2 - b2) <= EPSILON * Math.max(1.0, Math.abs(a2), Math.abs(b2)) &&
            Math.abs(a3 - b3) <= EPSILON * Math.max(1.0, Math.abs(a3), Math.abs(b3)) &&
            Math.abs(a4 - b4) <= EPSILON * Math.max(1.0, Math.abs(a4), Math.abs(b4)) &&
            Math.abs(a5 - b5) <= EPSILON * Math.max(1.0, Math.abs(a5), Math.abs(b5)) &&
            Math.abs(a6 - b6) <= EPSILON * Math.max(1.0, Math.abs(a6), Math.abs(b6)) &&
            Math.abs(a7 - b7) <= EPSILON * Math.max(1.0, Math.abs(a7), Math.abs(b7)) &&
            Math.abs(a8 - b8) <= EPSILON * Math.max(1.0, Math.abs(a8), Math.abs(b8))
        );
    }

    public m00: number;
    public m01: number;
    public m02: number;
    public m03: number;
    public m04: number;
    public m05: number;
    public m06: number;
    public m07: number;
    public m08: number;

    constructor (
        m00 = 1, m01 = 0, m02 = 0,
        m03 = 0, m04 = 1, m05 = 0,
        m06 = 0, m07 = 0, m08 = 1,
    ) {
        console.warn('Obsolete Vmath API');
        this.m00 = m00;
        this.m01 = m01;
        this.m02 = m02;
        this.m03 = m03;
        this.m04 = m04;
        this.m05 = m05;
        this.m06 = m06;
        this.m07 = m07;
        this.m08 = m08;
    }
}

const v3_1 = vec3.create(0, 0, 0);
const v3_2 = vec3.create(0, 0, 0);
