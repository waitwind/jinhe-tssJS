;(function($){
    /*
     *  大数据显示进度
     *  参数： string:url         同步进度请求地址
               xmlNode:data                    
               string:cancelUrl   取消进度请求地址
     */
    var Progress = function(url, data, cancelUrl) {
        this.progressUrl = url;
        this.cancelUrl = cancelUrl;
        this.refreshData(data);
    };

    Progress.prototype = {
        /* 更新数据 */
        refreshData: function(data) {
            this.percent      = $.XML.getText(data.querySelector("percent"));
            this.delay        = $.XML.getText(data.querySelector("delay"));
            this.estimateTime = $.XML.getText(data.querySelector("estimateTime"));
            this.code         = $.XML.getText(data.querySelector("code"));

            var feedback = data.querySelector("feedback");
            if( feedback ) {
                alert($.XML.getText(feedback));
            }
        },

        /* 开始执行  */
        start: function() {
            this.show();
            this.next();
        },

        /* 停止执行  */
        stop: function() {
            var pThis = this;
            $.ajax({
                url: this.cancelUrl + pThis.code,
                method: "DELETE",
                onsuccess: function() {
                    pThis.hide();
                    clearTimeout(pThis.timeout);
                }
            });
        },

        /* 显示进度  */
        show: function() {
            var pThis = this;

            var graph = $1("progressBar");
            if(graph == null) {
                graph = $.createElement("div", "progressBar");
                $(graph).center(500, 50).css("width", "500px").css("color", "#fff").css("fontSize", "16px");

                var bar = $.createElement("div", "bar");
                $(bar).css("display", "block").css("backgroundColor", "green").css("border", "1px solid #F8B3D0")
                    .css("height", "25px").css("textAlign", "center").css("padding", "3px 0 0 0");     

                var info = $.createElement("span", "info");
                $(info).html("剩余时间:<span'>1</span>秒").css("padding", "0 0 0 100px");

                var cancel = $.createElement("span");
                $(cancel).html("<a href='#'>取 消</a>").css("width", "50px").css("padding", "0 0 0 100px")
                    .click(function() { pThis.stop(); });

                graph.appendChild(bar);
                graph.appendChild(info);
                graph.appendChild(cancel);
                document.body.appendChild(graph);
            }

            $(".bar", graph).css("width", this.percent + "%").html(this.percent + "%"); 
            $(".info span", graph).html(this.estimateTime); 
        },

        /* 隐藏进度 */
        hide: function() {
            $(".progressBar").each(function(i, el) {
                $.removeNode(el);
            })
        },

        /* 同步进度  */
        sync: function() {
            var pThis = this;
            $.ajax({
                url: this.progressUrl + this.code,
                method: "GET",
                async: false,
                onresult: function() {
                    var data = this.getNodeValue("ProgressInfo");
                    pThis.refreshData(data);
                    pThis.show();
                    pThis.next();
                },
                onexception: function() {
                    pThis.hide();
                }
            });
        },

        /* 延时进行下一次同步  */
        next: function() {
            var pThis = this;

            var percent = parseInt(this.percent);
            var delay   = parseInt(this.delay) * 1000;
            if(100 > percent) {
                this.timeout = setTimeout(function() {
                    pThis.sync();
                }, delay);
            }
            else if( this.oncomplete ) {
                setTimeout(function() {
                    pThis.hide();
                    pThis.oncomplete();
                }, 200);
            }
        }
    }

    $.Progress = Progress;

})(tssJS);