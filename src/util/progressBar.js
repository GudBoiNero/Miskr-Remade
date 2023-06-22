/**
 * 
 * @param {Number} value 
 * @param {Number} end 
 * @returns 
 */
const progressBar = (value, end, options = { fillchar: '█', emptychar: ' ', length: 25 }) => {
    const percentage = (value / end)
    const charPercentage = percentage * options.length
    let result = ''

    for (let i = 0; i < options.length; i++) {
        result += (i / options.length) * options.length <= charPercentage ? options.fillchar : options.emptychar
    }

    return '``' + result + '``' + ' ' + '``' + `${value}/${end}` + '``'
}

module.exports = progressBar