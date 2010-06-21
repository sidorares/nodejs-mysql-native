function deque()
{
    this.begin = null;
    this.end = null;
}

deque.prototype.push = function(data)
{
    if (!this.begin)
    {
        this.begin = this.end = { 'data': data };
        this.begin.next = this.begin; 
        this.begin.prev = this.begin; 
    } else {
        var end = this.end;
        this.end = { 'data': data };
        this.end.prev = end;
        end.next = this.end;
    }
    ++this.length;
}

deque.prototype.top = function()
{
    if (this.begin)
        return this.begin.data;
}

deque.prototype.empty = function()
{
    return this.length == 0;
    //return this.begin == null;
}

deque.prototype.shift = function()
{
    if (this.begin == this.end)
    {
        this.begin = this.end = null;
        return this.begin;
    }
    var res = this.begin.data;
    this.begin = this.begin.next;
    --length;
    return res;
}

exports.queue = deque;
