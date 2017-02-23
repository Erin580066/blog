module.exports = function (num) {
    var time = new Date();
    var year = time.getFullYear();
    var month = time.getMonth() + 1;
    var day = time.getDate();
    var w = time.getDay();//0-6代表周日-周六
    var wstr = '日一二三四五六', week = wstr.charAt(w);
    var hours = time.getHours();
    var minutes = time.getMinutes();
    var seconds = time.getSeconds();
    var mlSeconds = time.getMilliseconds();

    var obj = {
        year: year,
        month: month,
        day: day,
        week: '星期' + week,
        time: year + '-' + zero(month) + '-' + zero(day) + ' ' + zero(hours) + ':' + zero(minutes)
    };
    switch (num) {
        case 1:
            obj.time = year + '-' + zero(month) + '-' + zero(day);
            break;
        case 2:
            obj.time = zero(hours) + ':' + zero(minutes) + ':' + zero(seconds);
            break;
        case 3:
            obj.time = obj.time = year + '年' + zero(month) + '月' + zero(day) + '日';
            break;
        case 4:
            obj.time = zero(hours) + '时' + zero(minutes) + '分' + zero(seconds) + '秒';
            break;
    }

    return obj;
};
function zero(value) {
    return value < 10 ? '0' + value : value;
}