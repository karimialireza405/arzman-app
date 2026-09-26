/**
 * Square (1x1) country flags for the round currency avatars.
 *
 * Vendored from country-flag-icons 1.6.20 (1x1 set) — only the five flags ArzMan
 * needs, instead of a 5.8 MB dependency. The 1x1 set is drawn for square crops,
 * so the US canton and the Iraqi/Iranian inscriptions stay centred inside a
 * circle rather than being sliced off a 3:2 flag.
 *
 * (The MIT License)
 * Copyright (c) 2020 @catamphetamine <purecatamphetamine@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** ISO-3166 flag → SVG markup. Keyed by the flag, not the currency. */
export const flagSvg = {
  US: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"59.85 0 342 342\"><path fill=\"#FFF\" d=\"M0 0h513v342H0z\"/><g fill=\"#D80027\"><path d=\"M0 0h513v26.3H0zM0 52.6h513v26.3H0zM0 105.2h513v26.3H0zM0 157.8h513v26.3H0zM0 210.5h513v26.3H0zM0 263.1h513v26.3H0zM0 315.7h513V342H0z\"/></g><path fill=\"#2E52B2\" d=\"M0 0h256.5v184.1H0z\"/><g fill=\"#FFF\"><path d=\"m47.8 138.9-4-12.8-4.4 12.8H26.2l10.7 7.7-4 12.8 10.9-7.9 10.6 7.9-4.1-12.8 10.9-7.7zM104.1 138.9l-4.1-12.8-4.2 12.8H82.6l10.7 7.7-4 12.8 10.7-7.9 10.8 7.9-4-12.8 10.7-7.7zM160.6 138.9l-4.3-12.8-4 12.8h-13.5l11 7.7-4.2 12.8 10.7-7.9 11 7.9-4.2-12.8 10.7-7.7zM216.8 138.9l-4-12.8-4.2 12.8h-13.3l10.8 7.7-4 12.8 10.7-7.9 10.8 7.9-4.3-12.8 11-7.7zM100 75.3l-4.2 12.8H82.6L93.3 96l-4 12.6 10.7-7.8 10.8 7.8-4-12.6 10.7-7.9h-13.4zM43.8 75.3l-4.4 12.8H26.2L36.9 96l-4 12.6 10.9-7.8 10.6 7.8L50.3 96l10.9-7.9H47.8zM156.3 75.3l-4 12.8h-13.5l11 7.9-4.2 12.6 10.7-7.8 11 7.8-4.2-12.6 10.7-7.9h-13.2zM212.8 75.3l-4.2 12.8h-13.3l10.8 7.9-4 12.6 10.7-7.8 10.8 7.8-4.3-12.6 11-7.9h-13.5zM43.8 24.7l-4.4 12.6H26.2l10.7 7.9-4 12.7L43.8 50l10.6 7.9-4.1-12.7 10.9-7.9H47.8zM100 24.7l-4.2 12.6H82.6l10.7 7.9-4 12.7L100 50l10.8 7.9-4-12.7 10.7-7.9h-13.4zM156.3 24.7l-4 12.6h-13.5l11 7.9-4.2 12.7 10.7-7.9 11 7.9-4.2-12.7 10.7-7.9h-13.2zM212.8 24.7l-4.2 12.6h-13.3l10.8 7.9-4 12.7 10.7-7.9 10.8 7.9-4.3-12.7 11-7.9h-13.5z\"/></g></svg>",
  EU: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 408 408\"><path fill=\"#039\" d=\"M0 0h408v408H0V0z\"/><path fill=\"#FC0\" d=\"m203.963 45.231 5.089 15.653h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.323 9.68 5.089-15.662-13.322-9.68h16.468l5.087-15.661zm-68 18.134 5.089 15.653h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.681h16.468l5.089-15.66zm-49.867 49.866 5.089 15.653h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.68h16.468l5.089-15.661zM67.963 181.23l5.089 15.654h16.542l-13.323 9.682 5.016 15.67-13.324-9.682-13.323 9.682 5.089-15.664-13.323-9.679h16.468l5.089-15.663zm18.133 68.001 5.089 15.654h16.542l-13.323 9.68 5.016 15.67-13.324-9.68-13.323 9.68 5.089-15.662-13.323-9.68h16.468l5.089-15.662zm49.867 49.867 5.089 15.654h16.542l-13.323 9.68 5.016 15.67-13.324-9.679-13.323 9.679 5.089-15.661-13.323-9.681h16.468l5.089-15.662zm136-235.733 5.089 15.653h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.324 9.68 5.09-15.662-13.322-9.681h16.468l5.087-15.66zm49.867 49.866 5.088 15.653h16.543l-13.323 9.68 5.015 15.67-13.322-9.68-13.324 9.68 5.09-15.662-13.323-9.68h16.468l5.088-15.661zm18.133 68 5.089 15.653h16.542l-13.322 9.682 5.015 15.67-13.323-9.682-13.323 9.682 5.089-15.664-13.322-9.679h16.468l5.087-15.662zm-18.133 68 5.088 15.654h16.543l-13.323 9.68 5.016 15.67-13.323-9.68-13.324 9.68 5.09-15.662-13.323-9.68h16.469l5.087-15.662zm-117.867 68 5.089 15.654h16.542l-13.322 9.68 5.015 15.67-13.323-9.68-13.323 9.68 5.089-15.662-13.322-9.68h16.468l5.087-15.662zm68-18.133 5.089 15.654h16.542l-13.322 9.68 5.016 15.67-13.324-9.68-13.322 9.68 5.088-15.662-13.322-9.68h16.469l5.086-15.662z\"/></svg>",
  AE: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"51.3 0 342 342\"><path fill=\"#FFF\" d=\"M0 0h513v342H0z\"/><path fill=\"#00843d\" d=\"M0 0h513v114H0z\"/><path d=\"M0 228h513v114H0z\"/><path fill=\"#c8102e\" d=\"M0 0h171v342H0z\"/></svg>",
  IQ: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"85.5 0 342 342\"><path fill=\"#FFF\" d=\"M0 0h513v342H0z\"/><path fill=\"#CE1126\" d=\"M0 0h513v114H0z\"/><path d=\"M0 228h513v114H0z\"/><g fill=\"#547C31\"><path d=\"M219.2 160.7h-29.3c1.5-5.7 6.6-9.9 12.8-9.9v-19.9c-18.3 0-33.1 14.9-33.1 33.1v16.5h49.6c1.8 0 3.3 1.5 3.3 3.3v6.6h-66.2v19.9h86.1v-26.5c0-12.7-10.4-23.1-23.2-23.1zM268.8 190.5v-59.6H249v79.5h33.1v-19.9zM335 190.5v-59.6h-19.8v59.6h-6.6v-19.8h-19.9v39.7h59.6v-19.9z\"/></g></svg>",
  IR: "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"85.5 0 342 342\"><path fill=\"#FFF\" d=\"M0 0h512v342H0z\"/><path fill=\"#6DA544\" d=\"M0 0h513v114H0z\"/><g fill=\"#D80027\"><path d=\"M0 227.9h513v114H0zM278.8 134.8c.1 2 8.7 26.2 4.4 39.4-6.6 20.3-15.8 21.8-19.8 24.5V134l-6.9-4.2-6.9 4.2v64.7c-4-2.7-12.4-2.4-19.8-24.5-4.3-12.7 5.7-37.3 5.8-39.2 0 0-9.5 8.1-15.8 24-5.9 14.8 1.9 49.6 29.5 54.8 2.3.4 4.7 5.6 7.2 5.6 2.1 0 4.1-5.2 6-5.5 28.4-4.6 35-41.7 29.9-55.6-5.4-14.6-13.6-23.5-13.6-23.5z\"/></g><g fill=\"#FFF\" opacity=\".5\"><path d=\"M44.6 98.9h22.3v24.4H44.6zM0 98.9h22.3v24.4H0zM89.2 98.9h22.3v24.4H89.2zM133.8 98.9h22.3v24.4h-22.3zM178.4 98.9h22.3v24.4h-22.3zM223 98.9h22.3v24.4H223zM267.7 98.9H290v24.4h-22.3zM312.3 98.9h22.3v24.4h-22.3zM356.9 98.9h22.3v24.4h-22.3zM401.5 98.9h22.3v24.4h-22.3zM446.1 98.9h22.3v24.4h-22.3zM490.7 98.9H513v24.4h-22.3zM44.6 216.9h22.3v25.5H44.6zM0 216.9h22.3v25.5H0zM89.2 216.9h22.3v25.5H89.2zM133.8 216.9h22.3v25.5h-22.3zM178.4 216.9h22.3v25.5h-22.3zM223 216.9h22.3v25.5H223zM267.7 216.9H290v25.5h-22.3zM312.3 216.9h22.3v25.5h-22.3zM356.9 216.9h22.3v25.5h-22.3zM401.5 216.9h22.3v25.5h-22.3zM446.1 216.9h22.3v25.5h-22.3zM490.7 216.9H513v25.5h-22.3z\"/></g></svg>",
} as const;

export type FlagCode = keyof typeof flagSvg;
