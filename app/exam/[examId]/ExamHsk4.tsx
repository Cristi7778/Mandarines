'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { saveExamProgress, getUserProgress, saveUserProgress } from '@/lib/db';
import { addXp, updateStreak } from '@/lib/xp';
import { getExamById } from '@/lib/data/exams';
import type { UserProgress } from '@/lib/types';

const EXAM_ID    = 'exam-hsk4-h41001';
const TOTAL_Q    = 100;
const MAX_SCORE  = 300;
const PASS_SCORE = 180;

const AUD = (n: number) => `/hsk4/audio/item${String(n).padStart(2, '0')}.mp3`;

type Opt4 = 'A' | 'B' | 'C' | 'D';

// ── Word banks (R1) ───────────────────────────────────────────────────────────

const R1A_BANK: Record<string,string> = { A:'禁止', B:'海洋', C:'推迟', D:'坚持', E:'顺便', F:'估计' };
const R1A_LETTERS = ['A','B','C','D','E','F'];
const R1B_BANK: Record<string,string> = { A:'工具', B:'收', C:'温度', D:'到底', E:'辛苦', F:'抱歉' };
const R1B_LETTERS = ['A','B','C','D','E','F'];

// ── Question data ─────────────────────────────────────────────────────────────

const L1_QS: { num:number; audio:string; statement:string; answer:string }[] = [
  { num:1,  audio:AUD(1),  statement:'今天天气不错。',         answer:'✓' },
  { num:2,  audio:AUD(2),  statement:'他们俩经常聊天。',       answer:'✗' },
  { num:3,  audio:AUD(3),  statement:'做西红柿鸡蛋汤很简单。', answer:'✓' },
  { num:4,  audio:AUD(4),  statement:'他爱打篮球。',           answer:'✓' },
  { num:5,  audio:AUD(5),  statement:'小刘受到了表扬。',       answer:'✓' },
  { num:6,  audio:AUD(6),  statement:'他刚下飞机。',           answer:'✗' },
  { num:7,  audio:AUD(7),  statement:'姐妹俩性格差不多。',     answer:'✗' },
  { num:8,  audio:AUD(8),  statement:'他想给老王一张演出票。', answer:'✓' },
  { num:9,  audio:AUD(9),  statement:'小张的调查结果写得很好。', answer:'✗' },
  { num:10, audio:AUD(10), statement:'女儿不同意打针。',       answer:'✗' },
];

const L2_QS: { num:number; audio:string; options:Record<string,string>; answer:string }[] = [
  { num:11, audio:AUD(11), options:{A:'银行对面',B:'银行右边',C:'车站附近',D:'使馆西边'}, answer:'A' },
  { num:12, audio:AUD(12), options:{A:'请假',B:'唱歌',C:'散步',D:'买东西'}, answer:'D' },
  { num:13, audio:AUD(13), options:{A:'不想吃饭',B:'需要鼓励',C:'放弃减肥',D:'继续运动'}, answer:'C' },
  { num:14, audio:AUD(14), options:{A:'准备礼物',B:'打印材料',C:'收拾房间',D:'讨论问题'}, answer:'B' },
  { num:15, audio:AUD(15), options:{A:'很感动',B:'很突然',C:'很后悔',D:'很失望'}, answer:'B' },
  { num:16, audio:AUD(16), options:{A:'是新的',B:'刚修好',C:'质量不合格',D:'样子很流行'}, answer:'A' },
  { num:17, audio:AUD(17), options:{A:'步行',B:'开车',C:'坐地铁',D:'打出租车'}, answer:'B' },
  { num:18, audio:AUD(18), options:{A:'结婚',B:'去旅游',C:'出国工作',D:'出国读书'}, answer:'D' },
  { num:19, audio:AUD(19), options:{A:'20块',B:'30块',C:'40块',D:'60块'}, answer:'B' },
  { num:20, audio:AUD(20), options:{A:'太旧了',B:'很奇怪',C:'有点儿长',D:'最好换一件'}, answer:'D' },
  { num:21, audio:AUD(21), options:{A:'气候',B:'文化',C:'风景',D:'职业'}, answer:'A' },
  { num:22, audio:AUD(22), options:{A:'花园',B:'教室',C:'公司',D:'宾馆'}, answer:'C' },
  { num:23, audio:AUD(23), options:{A:'请客',B:'按时到',C:'别生气',D:'换一个航班'}, answer:'B' },
  { num:24, audio:AUD(24), options:{A:'很穷',B:'很粗心',C:'不专业',D:'不友好'}, answer:'B' },
  { num:25, audio:AUD(25), options:{A:'父亲节',B:'花很便宜',C:'妈妈生病了',D:'朋友过生日'}, answer:'A' },
];

const L3A_QS: { num:number; audio:string; dialogueZh:string; questionZh:string; options:Record<string,string>; answer:string }[] = [
  { num:26, audio:AUD(26), dialogueZh:'女：打了一下午羽毛球，肚子有点儿饿了。男：稍等一会儿，饭马上就好。女：真香，今天吃什么？男：你鼻子真好，今晚我们吃饺子。', questionZh:'他们今晚吃什么？', options:{A:'面条',B:'米饭',C:'饺子',D:'蛋糕'}, answer:'C' },
  { num:27, audio:AUD(27), dialogueZh:'男：小李，刚才跟你说话的那个女孩儿是谁啊？女：我大学同学，你认识？男：应该不认识，但是好像在哪儿见过。女：那你可能是在我的大学毕业照上见过吧。', questionZh:'那个女孩儿和小李是什么关系？', options:{A:'亲戚',B:'同学',C:'师生',D:'同事'}, answer:'B' },
  { num:28, audio:AUD(28), dialogueZh:'女：你好，请问王师傅在家吗？男：他不在家，他游泳去了。女：那他什么时候回来呢？男：一会儿就回来了吧。女：好的，那我过一会儿再联系吧，打扰了，再见。', questionZh:'王师傅做什么去了？', options:{A:'洗澡',B:'游泳',C:'爬山',D:'逛街'}, answer:'B' },
  { num:29, audio:AUD(29), dialogueZh:'男：上午刚借的那本杂志，怎么找不到了？女：哪本杂志？男：体育杂志，黄皮儿的，我就放在桌子上。女：不用到处找了，我刚看了一下，在沙发上呢。', questionZh:'男的在找什么？', options:{A:'杂志',B:'地图',C:'护照',D:'笔记本'}, answer:'A' },
  { num:30, audio:AUD(30), dialogueZh:'女：先生，对不起，我们这儿不能抽烟。男：请问，附近有可以抽烟的地方吗？女：有，请直走，然后向左，那儿有一个吸烟室。男：谢谢。', questionZh:'他们最可能在哪儿？', options:{A:'路上',B:'饭店里',C:'邻居家',D:'公共汽车上'}, answer:'B' },
  { num:31, audio:AUD(31), dialogueZh:'男：李教授，这几篇文章您什么时候要？女：不急，你自己安排，只要在寒假前交给我就行。男：没问题，我肯定会提前完成的。女：那样更好。', questionZh:'李教授什么时候要那几篇文章？', options:{A:'中午',B:'周末',C:'月底',D:'寒假前'}, answer:'D' },
  { num:32, audio:AUD(32), dialogueZh:'女：先生，这是您的房卡，请拿好。男：谢谢！我的行李箱在哪儿取呢？女：我们一会儿会直接送到您的房间。男：谢谢！麻烦你们了。女：不客气。', questionZh:'女的最可能是做什么的？', options:{A:'校长',B:'服务员',C:'理发师',D:'医院护士'}, answer:'B' },
  { num:33, audio:AUD(33), dialogueZh:'男：你好，我想要一个窗户旁边的座位，还有吗？女：我查一下。对不起，您乘坐的这个航班没有窗户边的座位了。男：好吧，没关系。女：给您票。', questionZh:'男的想要什么样的座位？', options:{A:'很软的',B:'离入口近的',C:'宽一点儿的',D:'窗户旁边的'}, answer:'D' },
  { num:34, audio:AUD(34), dialogueZh:'女：把香蕉皮扔到垃圾桶里去，以后别随便扔东西。男：知道了，奶奶。女：数学作业写完了吗？男：没呢，我先出去玩儿一会儿，您在家休息吧。', questionZh:'根据对话，可以知道什么？', options:{A:'天黑了',B:'西瓜不好吃',C:'孙子去上课',D:'作业没写完'}, answer:'D' },
  { num:35, audio:AUD(35), dialogueZh:'男：你换球鞋干什么啊？又要出去啊？女：去打网球。我约了小王，她打网球很厉害，你敢和她打吗？男：当然敢。女：那一起去！走吧，人多了还热闹。', questionZh:'小王的网球打得怎么样？', options:{A:'很不错',B:'力气太小',C:'仍然不会',D:'动作不漂亮'}, answer:'A' },
];

const L3B_PASSAGES: { passageZh:string; questions:{ num:number; questionZh:string; options:Record<string,string>; answer:string }[] }[] = [
  { passageZh:'这房子家具全，电视、空调、冰箱都有并且都很新；离火车站也很近，交通方便，离您公司也不远，您可以坐公共汽车甚至可以骑自行车上班，把身体也锻炼了；价格也比较便宜，真的很值得考虑。',
    questions:[{ num:36, questionZh:'说话人最可能是做什么的？', options:{A:'校长',B:'服务员',C:'理发师',D:'卖房的'}, answer:'D' },{ num:37, questionZh:'关于这房子，下列哪个正确？', options:{A:'很贵',B:'离机场近',C:'交通方便',D:'周围风景不错'}, answer:'C' }]},
  { passageZh:'狗是一种聪明的动物，它能听懂人的话，明白人的心情，会和人产生感情。人们喜欢养狗，是因为在孤单的时候，狗会陪着他们，互相信任，互相照顾。',
    questions:[{ num:38, questionZh:'根据这段话，狗有什么特点？', options:{A:'干净',B:'聪明',C:'有趣',D:'有耐心'}, answer:'B' },{ num:39, questionZh:'人们为什么喜欢狗？', options:{A:'可以更勇敢',B:'想减少危险',C:'会感到安全',D:'有时会孤单'}, answer:'D' }]},
  { passageZh:'这个节目我一直在看，它介绍了很多生活中的小知识，包括怎样选择牙膏，擦脸应该用什么毛巾，怎样远离皮肤病等等。很多以前我没有注意到的问题，现在通过它了解了不少。',
    questions:[{ num:40, questionZh:'说话人在介绍什么？', options:{A:'一本书',B:'一个报道',C:'一个广告',D:'一个电视节目'}, answer:'D' },{ num:41, questionZh:'说话人了解了哪方面的知识？', options:{A:'艺术',B:'生活',C:'国际',D:'法律'}, answer:'B' }]},
  { passageZh:'昨天，妻子让我陪她去买一双袜子。进了商店，她先去看帽子，觉得有个帽子很可爱，就买了一个。然后她又买了一条裤子、一件衬衫，把她身上带的钱全花完后我们就回家了。回家以后，我吃惊地发现，竟然没有买袜子。',
    questions:[{ num:42, questionZh:'他们计划买什么？', options:{A:'袜子',B:'食品',C:'饮料',D:'洗衣机'}, answer:'A' },{ num:43, questionZh:'说话人是谁？', options:{A:'丈夫',B:'导游',C:'司机',D:'售货员'}, answer:'A' }]},
  { passageZh:'哭不一定是坏事。遇到伤心事，哭一场就会感觉心里舒服多了；人们成功的时候，因为激动会哭；人们获得爱情和友谊的时候，因为感动也会哭。所以说，哭不一定是坏事。',
    questions:[{ num:44, questionZh:'伤心时哭一哭会怎么样？', options:{A:'更难过',B:'更紧张',C:'轻松许多',D:'觉得无聊'}, answer:'C' },{ num:45, questionZh:'这段话主要想告诉我们什么？', options:{A:'要懂礼貌',B:'要有同情心',C:'要互相理解',D:'哭不一定不好'}, answer:'D' }]},
];

const R1A_QS: { num:number; sentenceZh:string; answer:string }[] = [
  { num:46, sentenceZh:'你去买啤酒吗？（　）帮我买一盒牛奶吧。', answer:'E' },
  { num:47, sentenceZh:'刚才听广播说明天可能会下大雨，足球比赛恐怕要（　）了。', answer:'C' },
  { num:48, sentenceZh:'飞机上（　）使用手机，飞行过程中手机也要关上。', answer:'A' },
  { num:49, sentenceZh:'明天就可以在网上查成绩了，我（　）这次考得不坏。', answer:'F' },
  { num:50, sentenceZh:'地球上约71%的地方是蓝色的（　）。', answer:'B' },
];

const R1B_QS: { num:number; sentenceZh:string; answer:string }[] = [
  { num:51, sentenceZh:'A：丽丽说再等她几分钟，她马上就来。B：她（　）在干什么呢，怎么这么慢？', answer:'D' },
  { num:52, sentenceZh:'A：那个房间又脏又乱，星期六我去打扫、整理了一下。B：原来是你啊，（　）了，谢谢你！', answer:'E' },
  { num:53, sentenceZh:'A：我刚从会议室过来，怎么一个人也没有？B：对不起，今天的会议改到明天上午了，您没（　）到通知吗？', answer:'B' },
  { num:54, sentenceZh:'A：语言是交流的（　），只记字典里的字、词是不够的，要多听多说。B：对，这才是学习汉语的好方法。', answer:'A' },
  { num:55, sentenceZh:'A：真（　），我迟到了。B：没关系，表演还有5分钟才开始。', answer:'F' },
];

const R2_QS: { num:number; fragments:Record<string,string>; answer:string }[] = [
  { num:56, fragments:{A:'它就长满了这面墙，叶子很厚，绿绿的',B:'这种植物在这个季节长得很快',C:'经过短短一个星期'}, answer:'BCA' },
  { num:57, fragments:{A:'他很年轻',B:'比相同年龄的人更成熟',C:'可是遇到问题很冷静'}, answer:'ACB' },
  { num:58, fragments:{A:'让被批评的人不觉得难受，而且能感觉到是在帮助他',B:'例如批评人的时候要考虑用正确的方法',C:'管理是一门艺术'}, answer:'CBA' },
  { num:59, fragments:{A:'所以要想完全解决这个难题',B:'还需要找更好的办法',C:'这样做，只能暂时解决问题'}, answer:'CAB' },
  { num:60, fragments:{A:'所以这种游戏十分简单',B:'谁就赢了比赛',C:'谁在规定的时间内接到的球最多'}, answer:'CBA' },
  { num:61, fragments:{A:'这个任务没有那么困难',B:'而关键是要清楚我们的主要目的，找到重点',C:'我的看法是'}, answer:'CAB' },
  { num:62, fragments:{A:'我儿子的个子长得非常快',B:'今年春天就有很多不能穿了',C:'去年春天打折的时候我给他买了几件衣服'}, answer:'ACB' },
  { num:63, fragments:{A:'到时候你安排他们在市里参观一下',B:'今年暑假，有几个外国留学生要来学习一周',C:'其他的一些活动也都由你来组织'}, answer:'BAC' },
  { num:64, fragments:{A:'然而更多时候，留下的还是甜甜的回忆',B:'生活的味道是酸、甜、苦、辣、咸的',C:'其中的酸、苦、辣、咸是偶尔的不愉快'}, answer:'BCA' },
  { num:65, fragments:{A:'有的父母对孩子的要求很严格',B:'认为应该给孩子更多自己选择的机会',C:'有的父母正好相反'}, answer:'ACB' },
];

const R3A_QS: { num:number; passageZh:string; questionZh:string; options:Record<string,string>; answer:string }[] = [
  { num:66, passageZh:'刷牙的时候，水太冷或者太热，都会给牙的健康带来不好的影响。研究发现，用35度的温水刷牙才是最合适的。', questionZh:'刷牙时，我们应该：', options:{A:'使用温水',B:'常换牙刷',C:'早晚各一次',D:'至少刷5分钟'}, answer:'A' },
  { num:67, passageZh:'这种葡萄酒，不仅味道好，而且每个酒瓶也都像一件高级艺术品。很多人愿意出高价购买它，很多时候是被那些特别的酒瓶吸引了。', questionZh:'这种葡萄酒：', options:{A:'比较甜',B:'是艺术品',C:'酒瓶很特别',D:'是当地制造的'}, answer:'C' },
  { num:68, passageZh:'阅读能力好的人不但容易找到工作，而且工资也比较高。另外，阅读考试的分数往往还能反映一个国家的教育水平。', questionZh:'阅读能力好的人一般：', options:{A:'收入高',B:'烦恼少',C:'经历丰富',D:'年龄比较大'}, answer:'A' },
  { num:69, passageZh:'有些人喜欢不停地换工作，他们总以为新工作一定比现在的好。实际上，一般情况下，完全适应一个新的工作需要一年时间，因此，经常换工作不一定好，根据自己的条件，把一份工作坚持做到最好才是正确的选择。', questionZh:'有些人经常换工作是因为他们：', options:{A:'极其努力',B:'非常得意',C:'工作不愉快',D:'相信新工作更好'}, answer:'D' },
  { num:70, passageZh:'我喜欢读这份报纸，因为它的内容丰富，而且广告少，最重要的是，经济方面的新闻对我的工作很有帮助。', questionZh:'他喜欢这份报纸的原因之一是：', options:{A:'免费',B:'价格低',C:'广告少',D:'笑话多'}, answer:'C' },
  { num:71, passageZh:'医生提醒人们，在使用感冒药之前，一定要仔细阅读说明书。并且最好只选择一种感冒药，否则药物之间可能互相作用，会影响我们的健康。', questionZh:'医生一共有几个提醒？', options:{A:'一个',B:'两个',C:'3个',D:'4个'}, answer:'B' },
  { num:72, passageZh:'在中国生活的三年使他在音乐方面有了很多新的想法，他把京剧的一些特点增加到自己的音乐中，取得了很好的效果。', questionZh:'根据这段话，可以知道他：', options:{A:'很热情',B:'会唱京剧',C:'受到京剧影响',D:'离开中国三年了'}, answer:'C' },
  { num:73, passageZh:'儿子小时候一说话就脸红，回答老师问题的时候声音也很小，我当时很替他担心。但随着年龄的增长，他逐渐成熟了，大学毕业后成了一名优秀的律师，真让人吃惊。', questionZh:'\"让人吃惊\"的是儿子：', options:{A:'当了律师',B:'变得很笨',C:'越来越帅',D:'赚了很多钱'}, answer:'A' },
  { num:74, passageZh:'做生意时会遇到竞争带来的压力，但是大家的机会也是相同的。清楚地了解市场和顾客的需要，做一个符合市场发展需要的计划非常重要。', questionZh:'做生意需要重视：', options:{A:'节约',B:'反对意见',C:'积累经验',D:'了解市场需求'}, answer:'D' },
  { num:75, passageZh:'原谅是一种美，我们常说要学会原谅别人，但也要试着原谅自己。我们都有缺点，不可能把每件事都做得很好。', questionZh:'这段话主要说，我们应该：', options:{A:'感谢别人',B:'尊重别人',C:'原谅自己',D:'成为优秀的人'}, answer:'C' },
  { num:76, passageZh:'您好，我们翻译，每1000字150元人民币。这些信息在公司网站上都有详细的介绍，您有什么特别要求或任何不清楚的地方欢迎和我们联系。', questionZh:'说话人正在做什么？', options:{A:'总结',B:'招聘',C:'介绍',D:'道歉'}, answer:'C' },
  { num:77, passageZh:'大部分人每天晚上至少应该睡7个小时，但是这个标准并不适合每一个人，有些人即使只睡5个小时也很有精神。', questionZh:'每天晚上睡7个小时适合：', options:{A:'儿童',B:'胖子',C:'所有人',D:'大部分人'}, answer:'D' },
  { num:78, passageZh:'很多时候孩子发脾气是为了得到一些好处，父母不能因为孩子发脾气就给他好处。如果我们不重视这个问题，他就容易养成发脾气的坏习惯。', questionZh:'孩子发脾气主要是因为：', options:{A:'缺少关心',B:'父母批评他',C:'想得到好处',D:'想引起别人注意'}, answer:'C' },
  { num:79, passageZh:'什么是真正的朋友？有些人觉得就是能和自己一起快乐的人，其实朋友应该像镜子，能帮你看清自己的缺点；无论你成功或者失败，永远都支持你。', questionZh:'这段话主要谈：', options:{A:'谁能成功',B:'学会改变',C:'怎样支持朋友',D:'什么是真朋友'}, answer:'D' },
];

const R3B_PASSAGES: { passageZh:string; questions:{ num:number; questionZh:string; options:Record<string,string>; answer:string }[] }[] = [
  { passageZh:'世界上第一部无声电影出现的时候，吸引了成千上万的观众。有个女观众看到电影中有一辆马车向自己跑过来，害怕得离开了座位，跑得远远的，直到那辆马车在画面中不见了，她才回到座位上。有的观众看到电影里下雨的画面，把自己的雨伞也打了起来。现在我们都觉得挺好笑的，但是看电影在当时确实是个新鲜事儿。',
    questions:[{ num:80, questionZh:'世界上第一部无声电影：', options:{A:'很幽默',B:'不成功',C:'观众很多',D:'内容复杂'}, answer:'C' },{ num:81, questionZh:'那个观众为什么要打伞？', options:{A:'误会了',B:'下雨了',C:'风太大',D:'害怕马车'}, answer:'A' }]},
  { passageZh:'研究证明，女孩子们对衣服颜色的选择往往与她们的性格有关。喜欢穿白色衣服的女孩子们性格比较阳光，生活态度积极向上是她们的共同特点；而喜欢红色衣服的女孩子们性格比较浪漫，在爱情上也比较主动。',
    questions:[{ num:82, questionZh:'喜欢穿白色衣服的女孩子在生活中：', options:{A:'很懒',B:'很害羞',C:'很主动',D:'不幸福'}, answer:'C' },{ num:83, questionZh:'这段话主要讲了颜色和什么的关系？', options:{A:'理想',B:'能力',C:'性格',D:'性别'}, answer:'C' }]},
  { passageZh:'科学技术的发展确实给生活带来了许多方便，但也给我们增加了不少烦恼。最普遍的是，每个现代人头脑中都要记住很多密码：信用卡需要密码，电脑需要密码，电子信箱需要密码，有时候甚至连开门都需要密码。如果谁不小心忘记了这些密码，那麻烦可就大了。',
    questions:[{ num:84, questionZh:'人们需要记住什么？', options:{A:'友谊',B:'答案',C:'密码',D:'号码'}, answer:'C' },{ num:85, questionZh:'给人们带来烦恼的是：', options:{A:'科学技术',B:'电子信箱',C:'工作压力',D:'环境污染'}, answer:'A' }]},
];

const W1_QS: { num:number; words:string[]; answer:string; answerAlt?:string }[] = [
  { num:86, words:['会弹钢琴的人','羡慕','很','她'],               answer:'她很羡慕会弹钢琴的人。', answerAlt:'会弹钢琴的人很羡慕她。' },
  { num:87, words:['亚洲经济的','正在','逐渐','提高','增长速度'],  answer:'亚洲经济的增长速度正在逐渐提高。' },
  { num:88, words:['专为老年人','提供的','这椅子','是'],           answer:'这椅子是专为老年人提供的。' },
  { num:89, words:['中文','很流利','说得','他的'],                 answer:'他的中文说得很流利。' },
  { num:90, words:['已经','报名人数','900','超过了'],              answer:'报名人数已经超过了900。' },
  { num:91, words:['请','从小到大的顺序','按','排列','这些数字'],  answer:'请按从小到大的顺序排列这些数字。', answerAlt:'这些数字请按从小到大的顺序排列。' },
  { num:92, words:['作者','很有名','小说的','那本'],              answer:'那本小说的作者很有名。' },
  { num:93, words:['合格的警察','最需要的','一个','是责任感'],     answer:'一个合格的警察最需要的是责任感。' },
  { num:94, words:['代表们','结束','会议','决定'],                answer:'代表们决定结束会议。' },
  { num:95, words:['对','很熟悉','我','这个城市'],               answer:'我对这个城市很熟悉。', answerAlt:'对这个城市我很熟悉。' },
];

const W2_QS: { num:number; pictureDesc:string; word:string; wordPinyin:string; sampleAnswer:string }[] = [
  { num:96,  pictureDesc:'woman resting chin on hand, thoughtful', word:'日记',  wordPinyin:'rìjì',      sampleAnswer:'她每天都坚持写日记。' },
  { num:97,  pictureDesc:'chopsticks picking up a dumpling',       word:'尝',    wordPinyin:'cháng',     sampleAnswer:'你尝一尝？味道很好。' },
  { num:98,  pictureDesc:'broken eggshell',                        word:'破',    wordPinyin:'pò',        sampleAnswer:'鸡蛋被打破了。' },
  { num:99,  pictureDesc:'father and son walking on the beach',    word:'凉快',  wordPinyin:'liángkuai', sampleAnswer:'走在海边，感觉很凉快。' },
  { num:100, pictureDesc:'young girl smiling brightly',            word:'活泼',  wordPinyin:'huópō',     sampleAnswer:'这个小女孩儿很活泼。' },
];

// ── Parts ─────────────────────────────────────────────────────────────────────

const PARTS = [
  { label:'Listening · Part 1',  section:'L1',  questions: L1_QS as {num:number;answer:string}[] },
  { label:'Listening · Part 2',  section:'L2',  questions: L2_QS as {num:number;answer:string}[] },
  { label:'Listening · Part 3A', section:'L3A', questions: L3A_QS as {num:number;answer:string}[] },
  { label:'Listening · Part 3B', section:'L3B', questions: L3B_PASSAGES.flatMap(p => p.questions) as {num:number;answer:string}[] },
  { label:'Reading · Part 1A',   section:'R1A', questions: R1A_QS as {num:number;answer:string}[] },
  { label:'Reading · Part 1B',   section:'R1B', questions: R1B_QS as {num:number;answer:string}[] },
  { label:'Reading · Part 2',    section:'R2',  questions: R2_QS as {num:number;answer:string}[] },
  { label:'Reading · Part 3A',   section:'R3A', questions: R3A_QS as {num:number;answer:string}[] },
  { label:'Reading · Part 3B',   section:'R3B', questions: R3B_PASSAGES.flatMap(p => p.questions) as {num:number;answer:string}[] },
  { label:'Writing · Part 1',    section:'W1',  questions: W1_QS as {num:number;answer:string}[] },
  { label:'Writing · Part 2',    section:'W2',  questions: W2_QS.map(q => ({ num:q.num, answer:'1' })) },
];

const MATCHING_SECTIONS = new Set(['R1A','R1B']);

// ── Results screen ────────────────────────────────────────────────────────────

function ResultsScreen({ answers, xpEarned }: { answers:Record<number,string>; xpEarned:number }) {
  const lCorrect = PARTS.slice(0,4).flatMap(p => p.questions).filter(q => answers[q.num] === q.answer).length;
  const rCorrect = PARTS.slice(4,9).flatMap(p => p.questions).filter(q => answers[q.num] === q.answer).length;
  const wCorrect = PARTS.slice(9).flatMap(p => p.questions).filter(q => answers[q.num] === q.answer).length;
  const lScore   = Math.round(lCorrect / 45 * 100);
  const rScore   = Math.round(rCorrect / 40 * 100);
  const wScore   = Math.round(wCorrect / 15 * 100);
  const total    = lScore + rScore + wScore;
  const passed   = total >= PASS_SCORE;

  const breakdown = PARTS.map(p => ({
    label:   p.label,
    correct: p.questions.filter(q => answers[q.num] === q.answer).length,
    total:   p.questions.length,
  }));

  const sections = [
    { title:'Listening', score:lScore, rows:breakdown.slice(0,4) },
    { title:'Reading',   score:rScore, rows:breakdown.slice(4,9) },
    { title:'Writing',   score:wScore, rows:breakdown.slice(9) },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center space-y-2">
        <p className="text-5xl font-bold text-gray-800">{total}<span className="text-2xl text-gray-400 font-normal"> / {MAX_SCORE}</span></p>
        <p className={`text-base font-semibold ${passed ? 'text-green-600' : 'text-red-500'}`}>
          {passed ? (total >= 240 ? '🏆 Excellent!' : '✅ Pass') : '❌ Not passed — 180 required'}
        </p>
        <p className="text-sm text-amber-600 font-semibold">+{xpEarned} XP</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {sections.map(sec => (
          <div key={sec.title}>
            <div className="px-4 py-3 flex items-center justify-between bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">{sec.title}</span>
              <span className="text-sm font-semibold text-gray-700">{sec.score} / 100</span>
            </div>
            {sec.rows.map(p => (
              <div key={p.label} className="px-4 py-2.5 flex items-center justify-between pl-8">
                <span className="text-sm text-gray-500">{p.label}</span>
                <span className={`text-sm font-medium ${p.correct === p.total ? 'text-green-600' : p.correct/p.total >= 0.6 ? 'text-amber-600' : 'text-red-500'}`}>{p.correct} / {p.total}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Link href="/" className="block w-full bg-orange-500 text-white font-semibold py-4 rounded-xl text-center hover:bg-orange-600 transition-colors">
        Back to home
      </Link>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AudioBtn({ src, autoPlay }: { src:string; autoPlay?:boolean }) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (autoPlay && ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  return (
    <>
      <audio ref={ref} src={src} />
      <button onClick={() => { if (ref.current) { ref.current.currentTime = 0; ref.current.play().catch(() => {}); } }}
        className="w-12 h-12 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-xl shrink-0 transition-colors">🔊</button>
    </>
  );
}

function LetterPicker({ letters, selected, correctAnswer, confirmed, onSelect }: {
  letters:string[]; selected:string|null; correctAnswer:string; confirmed:boolean; onSelect:(v:string)=>void;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {letters.map(opt => {
        let cls = 'w-9 h-9 rounded-lg text-sm font-bold border-2 transition-colors ';
        if (confirmed) {
          if (opt === correctAnswer)  cls += 'border-green-400 bg-green-100 text-green-700';
          else if (opt === selected)  cls += 'border-red-400 bg-red-100 text-red-600';
          else                        cls += 'border-gray-100 bg-white text-gray-300';
        } else {
          cls += opt === selected
            ? 'border-orange-400 bg-orange-100 text-orange-700'
            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300';
        }
        return <button key={opt} className={cls} disabled={confirmed} onClick={() => onSelect(opt)}>{opt}</button>;
      })}
    </div>
  );
}

function WordBank({ bank, letters, confirmed, selected }: {
  bank:Record<string,string>; letters:string[]; confirmed:boolean; selected:Record<number,string>;
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {letters.map(letter => {
        const used = Object.values(selected).includes(letter);
        return (
          <div key={letter} className={`flex gap-2 items-center rounded-xl border px-3 py-2 text-sm ${
            confirmed && used ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
          }`}>
            <span className="font-bold text-gray-500 shrink-0">{letter}.</span>
            <span className="text-gray-700 chinese-text">{bank[letter]}</span>
          </div>
        );
      })}
    </div>
  );
}

function AbcdOptions({ options, selected, correctAnswer, confirmed, onSelect }: {
  options:Record<string,string>; selected:string|null; correctAnswer:string; confirmed:boolean; onSelect:(v:string)=>void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {(['A','B','C','D'] as Opt4[]).map(opt => (
        <button key={opt} onClick={() => onSelect(opt)} disabled={confirmed}
          className={`p-3 rounded-xl border-2 text-sm font-medium text-left transition-colors chinese-text ${
            confirmed
              ? opt === correctAnswer  ? 'border-green-400 bg-green-50 text-green-700'
                : opt === selected     ? 'border-red-400 bg-red-50 text-red-600'
                :                        'border-gray-100 bg-white text-gray-300'
              : selected === opt       ? 'border-orange-400 bg-orange-50 text-orange-700'
                :                        'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
          }`}>
          <span className="font-bold mr-1">{opt}.</span>{options[opt]}
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ExamHsk4() {
  const router  = useRouter();
  const user    = useUser();
  const exam    = getExamById(EXAM_ID);

  const [partIdx,        setPartIdx]        = useState(0);
  const [qIdx,           setQIdx]           = useState(0);
  const [selected,       setSelected]       = useState<string | null>(null);
  const [selected2,      setSelected2]      = useState<string | null>(null);
  const [confirmed,      setConfirmed]      = useState(false);
  const [matchAnswers,   setMatchAnswers]   = useState<Record<number,string>>({});
  const [matchConfirmed, setMatchConfirmed] = useState(false);
  const [answers,        setAnswers]        = useState<Record<number,string>>({});
  const [done,           setDone]           = useState(false);
  const [xpEarned,       setXpEarned]      = useState(0);
  const [userProgress,   setUserProgress]   = useState<UserProgress | null>(null);

  // W1 / R2 tap-to-build
  const [tapBankIdxs, setTapBankIdxs] = useState<number[]>([]);
  const [tapTrayIdxs, setTapTrayIdxs] = useState<number[]>([]);

  // W2
  const [w2Input, setW2Input] = useState('');

  useEffect(() => {
    if (user === null) { router.replace('/auth'); return; }
    if (!user) return;
    getUserProgress().then(setUserProgress);
  }, [user, router]);

  useEffect(() => {
    setQIdx(0); setSelected(null); setSelected2(null); setConfirmed(false);
    setMatchAnswers({}); setMatchConfirmed(false);
    setTapBankIdxs([]); setTapTrayIdxs([]);
    setW2Input('');
  }, [partIdx]);

  useEffect(() => {
    setSelected(null); setSelected2(null); setConfirmed(false); setW2Input('');
    const section = PARTS[partIdx]?.section;
    if (section === 'W1') {
      const wq = W1_QS[qIdx];
      if (wq) {
        const shuffled = wq.words.map((_, i) => i).sort(() => Math.random() - 0.5);
        setTapBankIdxs(shuffled); setTapTrayIdxs([]);
      }
    } else if (section === 'R2') {
      setTapBankIdxs([0,1,2]); setTapTrayIdxs([]);
    }
  }, [qIdx, partIdx]);

  if (user === undefined) {
    return <div className="min-h-screen bg-[#fcf0d7] flex items-center justify-center"><div className="text-4xl animate-pulse">🍊</div></div>;
  }
  if (!exam) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Exam not found. <Link href="/" className="text-orange-500 underline">Back to home</Link></p></div>;
  }

  const part       = PARTS[partIdx]!;
  const section    = part.section;
  const isMatching = MATCHING_SECTIONS.has(section);
  const partQs     = part.questions;

  const isPaired       = section === 'L3B' || section === 'R3B';
  const committedCount  = Object.keys(answers).length;
  const inProgressCount = isMatching
    ? Object.keys(matchAnswers).length
    : isPaired
      ? (confirmed ? qIdx + 2 : qIdx)
      : (confirmed ? qIdx + 1 : qIdx);

  const currentQ       = !isPaired ? partQs[qIdx] : undefined;
  const isCorrect      = !!currentQ && selected === currentQ.answer;
  const matchAllFilled = isMatching && partQs.every(q => matchAnswers[q.num] !== undefined);

  async function finishExam(finalAnswers: Record<number,string>) {
    const lCorrect = PARTS.slice(0,4).flatMap(p => p.questions).filter(q => finalAnswers[q.num] === q.answer).length;
    const rCorrect = PARTS.slice(4,9).flatMap(p => p.questions).filter(q => finalAnswers[q.num] === q.answer).length;
    const wCorrect = PARTS.slice(9).flatMap(p => p.questions).filter(q => finalAnswers[q.num] === q.answer).length;
    const total = Math.round(lCorrect/45*100) + Math.round(rCorrect/40*100) + Math.round(wCorrect/15*100);
    setXpEarned(total); setAnswers(finalAnswers); setDone(true);
    await saveExamProgress({ examId:EXAM_ID, score:total, total:MAX_SCORE, completedAt:new Date().toISOString() });
    if (userProgress) await saveUserProgress(updateStreak(addXp(userProgress, total)));
  }

  function handleSelect(val: string) { if (!confirmed) setSelected(val); }

  function handleConfirm() {
    if (isPaired) {
      const q1 = partQs[qIdx]; const q2 = partQs[qIdx + 1];
      if (!selected || !selected2 || !q1 || !q2) return;
      setConfirmed(true);
      setAnswers(prev => ({ ...prev, [q1.num]: selected, [q2.num]: selected2 }));
    } else {
      if (!selected || !currentQ) return;
      setConfirmed(true);
      setAnswers(prev => ({ ...prev, [currentQ.num]: selected }));
    }
  }

  async function handleNext() {
    setSelected(null); setSelected2(null); setConfirmed(false); setW2Input('');
    const advance = isPaired ? 2 : 1;
    if (qIdx + advance < partQs.length) { setQIdx(qIdx + advance); return; }
    if (partIdx + 1 < PARTS.length) { setQIdx(0); setPartIdx(partIdx + 1); return; }
    await finishExam({ ...answers });
  }

  function handleMatchPick(num: number, letter: string) {
    if (matchConfirmed) return;
    setMatchAnswers(prev => ({ ...prev, [num]: letter }));
  }

  async function handleMatchContinue() {
    const newAnswers = { ...answers, ...matchAnswers };
    if (partIdx + 1 < PARTS.length) { setAnswers(newAnswers); setQIdx(0); setPartIdx(partIdx + 1); }
    else await finishExam(newAnswers);
  }

  function tapPickFromBank(idx: number) { setTapBankIdxs(p => p.filter(i=>i!==idx)); setTapTrayIdxs(p=>[...p,idx]); }
  function tapReturnToBank(idx: number) { setTapTrayIdxs(p => p.filter(i=>i!==idx)); setTapBankIdxs(p=>[...p,idx]); }

  function handleW1Check() {
    const wq = W1_QS[qIdx]; if (!wq) return;
    const assembled = tapTrayIdxs.map(i => wq.words[i]).join('') + '。';
    const correct = assembled === wq.answer || assembled === wq.answerAlt;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [wq.num]: correct ? wq.answer : assembled }));
  }

  function handleR2Check() {
    const rq = R2_QS[qIdx]; if (!rq) return;
    const assembled = tapTrayIdxs.map(i => ['A','B','C'][i] ?? '').join('');
    const correct = assembled === rq.answer;
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [rq.num]: correct ? rq.answer : assembled }));
  }

  function handleW2Check() {
    const wq = W2_QS[qIdx]; if (!wq) return;
    const correct = w2Input.trim().includes(wq.word);
    setConfirmed(true);
    setAnswers(prev => ({ ...prev, [wq.num]: correct ? '1' : '0' }));
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="w-full px-6 py-3 flex items-center justify-center">
            <h1 className="font-bold text-gray-800 text-xl">{exam.name} · Results</h1>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
          <ResultsScreen answers={answers} xpEarned={xpEarned} />
        </main>
      </div>
    );
  }

  const nextLabel = qIdx + 1 < partQs.length ? 'Next →' : partIdx + 1 < PARTS.length ? 'Continue →' : 'Finish';

  return (
    <div className="min-h-screen bg-[#fcf0d7] flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-6 py-3 grid grid-cols-3 items-center">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-lg font-semibold">← Home</Link>
          <h1 className="font-bold text-gray-800 text-base truncate text-center">{exam.name}</h1>
          <div />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4">

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white rounded-full h-2 border border-gray-200">
              <div className="bg-orange-400 h-2 rounded-full transition-all"
                style={{ width:`${((committedCount + inProgressCount) / TOTAL_Q) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-500 shrink-0">{committedCount + inProgressCount} / {TOTAL_Q}</span>
          </div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {part.label}{!isMatching && currentQ ? ` · Q${currentQ.num}` : ''}
          </p>
        </div>

        {/* ── L1: ✓/✗ sequential ── */}
        {section === 'L1' && (() => {
          const lq = L1_QS[qIdx]; if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen once, then judge if the ★ statement is correct.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <p className="text-base chinese-text text-gray-700 leading-relaxed">★ {lq.statement}</p>
              </div>
              <div className="flex gap-3">
                {(['✓','✗']).map(opt => (
                  <button key={opt} onClick={() => handleSelect(opt)} disabled={confirmed}
                    className={`flex-1 py-4 rounded-xl text-2xl font-bold border-2 transition-colors ${
                      confirmed
                        ? opt === lq.answer    ? 'border-green-400 bg-green-50'
                          : opt === selected   ? 'border-red-400 bg-red-50'
                          :                      'border-gray-100 bg-white text-gray-300'
                        : selected === opt     ? 'border-orange-400 bg-orange-50'
                          :                      'border-gray-200 bg-white hover:border-gray-300'
                    }`}>{opt}</button>
                ))}
              </div>
              {confirmed && <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${lq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── L2: dialogue ABCD ── */}
        {section === 'L2' && (() => {
          const lq = L2_QS[qIdx]; if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen once, then choose the best answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
              <AbcdOptions options={lq.options} selected={selected} correctAnswer={lq.answer} confirmed={confirmed} onSelect={handleSelect} />
              {confirmed && <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${lq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── L3A: longer dialogue ABCD ── */}
        {section === 'L3A' && (() => {
          const lq = L3A_QS[qIdx]; if (!lq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen once, then choose the best answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={lq.audio} autoPlay /></div>
                <p className="text-sm font-medium text-gray-800 chinese-text">问：{lq.questionZh}</p>
              </div>
              <AbcdOptions options={lq.options} selected={selected} correctAnswer={lq.answer} confirmed={confirmed} onSelect={handleSelect} />
              {confirmed && <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${lq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── L3B: passage with 2 linked questions (both shown at once) ── */}
        {section === 'L3B' && (() => {
          const pgIdx = Math.floor(qIdx / 2);
          const pg = L3B_PASSAGES[pgIdx];
          const lq1 = pg?.questions[0];
          const lq2 = pg?.questions[1];
          if (!lq1 || !lq2 || !pg) return null;
          const c1 = selected === lq1.answer, c2 = selected2 === lq2.answer;
          const pairNextLabel = qIdx + 2 < partQs.length ? 'Next →' : 'Continue →';
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Listen once, then answer both questions.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <div className="flex justify-center"><AudioBtn src={`/hsk4/audio/item${36 + pgIdx * 2}-${37 + pgIdx * 2}.mp3`} autoPlay /></div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 chinese-text">Q{lq1.num}. {lq1.questionZh}</p>
                <AbcdOptions options={lq1.options} selected={selected} correctAnswer={lq1.answer} confirmed={confirmed} onSelect={v => !confirmed && setSelected(v)} />
                {confirmed && <p className={`text-sm font-medium ${c1 ? 'text-green-600' : 'text-red-500'}`}>{c1 ? '✅ Correct!' : `❌ Incorrect — answer: ${lq1.answer}`}</p>}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 chinese-text">Q{lq2.num}. {lq2.questionZh}</p>
                <AbcdOptions options={lq2.options} selected={selected2} correctAnswer={lq2.answer} confirmed={confirmed} onSelect={v => !confirmed && setSelected2(v)} />
                {confirmed && <p className={`text-sm font-medium ${c2 ? 'text-green-600' : 'text-red-500'}`}>{c2 ? '✅ Correct!' : `❌ Incorrect — answer: ${lq2.answer}`}</p>}
              </div>
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected || !selected2} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{pairNextLabel}</button>}
            </div>
          );
        })()}

        {/* ── R1A: fill blank from word bank ── */}
        {section === 'R1A' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Choose the correct word from the bank to fill each blank (Q46–50).</p>
            <WordBank bank={R1A_BANK} letters={R1A_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {R1A_QS.map(rq => (
                <div key={rq.num} className="px-4 py-3 space-y-2">
                  <p className="text-sm chinese-text text-gray-700 leading-relaxed"><span className="font-semibold text-gray-400 mr-2">Q{rq.num}</span>{rq.sentenceZh}</p>
                  <LetterPicker letters={R1A_LETTERS} selected={matchAnswers[rq.num]??null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v=>handleMatchPick(rq.num,v)} />
                </div>
              ))}
            </div>
            {!matchConfirmed
              ? <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check answers</button>
              : <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">Continue →</button>}
          </div>
        )}

        {/* ── R1B: fill blank from second word bank ── */}
        {section === 'R1B' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Choose the correct word from the bank to fill each blank (Q51–55).</p>
            <WordBank bank={R1B_BANK} letters={R1B_LETTERS} confirmed={matchConfirmed} selected={matchAnswers} />
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {R1B_QS.map(rq => (
                <div key={rq.num} className="px-4 py-3 space-y-2">
                  <p className="text-sm chinese-text text-gray-700 leading-relaxed"><span className="font-semibold text-gray-400 mr-2">Q{rq.num}</span>{rq.sentenceZh}</p>
                  <LetterPicker letters={R1B_LETTERS} selected={matchAnswers[rq.num]??null} correctAnswer={rq.answer} confirmed={matchConfirmed} onSelect={v=>handleMatchPick(rq.num,v)} />
                </div>
              ))}
            </div>
            {!matchConfirmed
              ? <button onClick={() => setMatchConfirmed(true)} disabled={!matchAllFilled} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check answers</button>
              : <button onClick={handleMatchContinue} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">Continue →</button>}
          </div>
        )}

        {/* ── R2: fragment ordering (tap-to-build) ── */}
        {section === 'R2' && (() => {
          const rq = R2_QS[qIdx]; if (!rq) return null;
          const r2Correct = confirmed && tapTrayIdxs.map(i=>['A','B','C'][i]??'').join('') === rq.answer;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tap the fragments in the correct order to form a sentence.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 min-h-[64px] flex flex-wrap gap-2 items-center">
                {tapTrayIdxs.length === 0 && <span className="text-gray-300 text-sm">Tap fragments below…</span>}
                {tapTrayIdxs.map((idx, pos) => (
                  <button key={pos} onClick={() => !confirmed && tapReturnToBank(idx)} disabled={confirmed}
                    className={`px-3 py-2 rounded-lg text-sm font-medium chinese-text ${confirmed ? (r2Correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700') : 'bg-orange-100 text-orange-800'}`}>
                    {['A','B','C'][idx]}. {rq.fragments[['A','B','C'][idx]??'A']}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {tapBankIdxs.map(idx => (
                  <button key={idx} onClick={() => !confirmed && tapPickFromBank(idx)} disabled={confirmed}
                    className="w-full px-3 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium text-left chinese-text hover:border-gray-300">
                    <span className="font-bold text-gray-400 mr-2">{['A','B','C'][idx]}.</span>{rq.fragments[['A','B','C'][idx]??'A']}
                  </button>
                ))}
              </div>
              {confirmed && <p className={`text-sm font-medium ${r2Correct ? 'text-green-600' : 'text-red-500'}`}>{r2Correct ? '✅ Correct!' : `❌ Incorrect — answer: ${rq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleR2Check} disabled={tapTrayIdxs.length < 3} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── R3A: passage + ABCD ── */}
        {section === 'R3A' && (() => {
          const rq = R3A_QS[qIdx]; if (!rq) return null;
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Read the passage, then choose the best answer.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm chinese-text text-gray-700 leading-relaxed">{rq.passageZh}</p>
                <p className="text-sm font-medium text-gray-800 chinese-text">★ {rq.questionZh}</p>
              </div>
              <AbcdOptions options={rq.options} selected={selected} correctAnswer={rq.answer} confirmed={confirmed} onSelect={handleSelect} />
              {confirmed && <p className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>{isCorrect ? '✅ Correct!' : `❌ Incorrect — answer: ${rq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── R3B: passage with 2 linked questions (both shown at once) ── */}
        {section === 'R3B' && (() => {
          const pgIdx = Math.floor(qIdx / 2);
          const pg = R3B_PASSAGES[pgIdx];
          const rq1 = pg?.questions[0];
          const rq2 = pg?.questions[1];
          if (!rq1 || !rq2 || !pg) return null;
          const c1 = selected === rq1.answer, c2 = selected2 === rq2.answer;
          const pairNextLabel = qIdx + 2 < partQs.length ? 'Next →' : 'Continue →';
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Read the passage, then answer both questions.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="text-sm chinese-text text-gray-700 leading-relaxed">{pg.passageZh}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 chinese-text">★ Q{rq1.num}. {rq1.questionZh}</p>
                <AbcdOptions options={rq1.options} selected={selected} correctAnswer={rq1.answer} confirmed={confirmed} onSelect={v => !confirmed && setSelected(v)} />
                {confirmed && <p className={`text-sm font-medium ${c1 ? 'text-green-600' : 'text-red-500'}`}>{c1 ? '✅ Correct!' : `❌ Incorrect — answer: ${rq1.answer}`}</p>}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-800 chinese-text">★ Q{rq2.num}. {rq2.questionZh}</p>
                <AbcdOptions options={rq2.options} selected={selected2} correctAnswer={rq2.answer} confirmed={confirmed} onSelect={v => !confirmed && setSelected2(v)} />
                {confirmed && <p className={`text-sm font-medium ${c2 ? 'text-green-600' : 'text-red-500'}`}>{c2 ? '✅ Correct!' : `❌ Incorrect — answer: ${rq2.answer}`}</p>}
              </div>
              {!confirmed
                ? <button onClick={handleConfirm} disabled={!selected || !selected2} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{pairNextLabel}</button>}
            </div>
          );
        })()}

        {/* ── W1: word rearrangement (tap-to-build) ── */}
        {section === 'W1' && (() => {
          const wq = W1_QS[qIdx]; if (!wq) return null;
          const assembled = tapTrayIdxs.map(i => wq.words[i]).join('') + '。';
          const w1Correct = confirmed && (assembled === wq.answer || assembled === wq.answerAlt);
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Tap the words in the correct order to form a sentence.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 min-h-[64px] flex flex-wrap gap-2 items-center">
                {tapTrayIdxs.length === 0 && <span className="text-gray-300 text-sm">Tap words below…</span>}
                {tapTrayIdxs.map((idx, pos) => (
                  <button key={pos} onClick={() => !confirmed && tapReturnToBank(idx)} disabled={confirmed}
                    className={`px-3 py-2 rounded-lg text-sm font-medium chinese-text ${confirmed ? (w1Correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700') : 'bg-orange-100 text-orange-800'}`}>
                    {wq.words[idx]}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {tapBankIdxs.map(idx => (
                  <button key={idx} onClick={() => !confirmed && tapPickFromBank(idx)} disabled={confirmed}
                    className="px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-medium chinese-text hover:border-gray-300">
                    {wq.words[idx]}
                  </button>
                ))}
              </div>
              {confirmed && <p className={`text-sm font-medium ${w1Correct ? 'text-green-600' : 'text-red-500'}`}>{w1Correct ? '✅ Correct!' : `❌ Incorrect — answer: ${wq.answer}`}</p>}
              {!confirmed
                ? <button onClick={handleW1Check} disabled={tapTrayIdxs.length < wq.words.length} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

        {/* ── W2: picture + word → type sentence ── */}
        {section === 'W2' && (() => {
          const wq = W2_QS[qIdx]; if (!wq) return null;
          const w2Correct = confirmed && w2Input.trim().includes(wq.word);
          return (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Use the given word to write a sentence about the picture.</p>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <img src={`/hsk4/images/w2_q${wq.num}.jpg`} alt={wq.pictureDesc} className="w-full h-48 object-cover rounded-xl" />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Given word:</span>
                  <span className="text-lg chinese-text font-bold text-orange-500">{wq.word}</span>
                  <span className="text-sm text-gray-400">{wq.wordPinyin}</span>
                </div>
              </div>
              <textarea value={w2Input} onChange={e => !confirmed && setW2Input(e.target.value)} disabled={confirmed}
                placeholder="Write your sentence here…"
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-base chinese-text resize-none h-24 focus:border-orange-400 focus:outline-none bg-white" />
              {confirmed && (
                <div className="space-y-1">
                  <p className={`text-sm font-medium ${w2Correct ? 'text-green-600' : 'text-red-500'}`}>
                    {w2Correct ? '✅ Correct!' : '❌ Incorrect.'}
                  </p>
                  {!w2Correct && <p className="text-xs text-gray-400">Example: {wq.sampleAnswer}</p>}
                </div>
              )}
              {!confirmed
                ? <button onClick={handleW2Check} disabled={!w2Input.trim()} className="w-full bg-orange-500 text-white font-semibold py-4 rounded-xl hover:bg-orange-600 disabled:opacity-40 transition-colors">Check</button>
                : <button onClick={handleNext} className="w-full bg-gray-800 text-white font-semibold py-4 rounded-xl hover:bg-gray-900 transition-colors">{nextLabel}</button>}
            </div>
          );
        })()}

      </main>
    </div>
  );
}
