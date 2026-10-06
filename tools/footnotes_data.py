import os
import json
import re

# Exact map of footnote texts per chapter from raw forum posts
RAW_FOOTNOTES = {
    4: [
        {
            "id": 1,
            "target_ref": "John 1:33",
            "title": "Varian Naskah John 1:33 (\"bercahaya\")",
            "text": "Kata \"bercahaya\" pada ayat John 1:33 tidak terdapat dalam manuscript UBS/Westcott and Hort yang digunakan oleh terjemahan LAI TB dan juga dalam manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008) tetapi ada dalam manuscript Diatessaron. Kata ini (\"bercahaya\") agaknya mengacu pada manuscript lain atau merupakan kata yg dipahami secara paralel dengan kata \"bercahaya\" pada ayat John 1:5 yg mencatat \"Terang itu bercahaya....\""
        }
    ],
    38: [
        {
            "id": 1,
            "target_ref": "Luke 9:56",
            "title": "Varian Naskah Luke 9:55-56",
            "text": "Kalimat ...dan berkata, \"Kamu tidak memahami, dari roh semacam apa kamu berasal! pada ayat Luke 9:55 dan kalimat \"Sebab Anak Manusia datang tidak untuk membinasakan jiwa manusia, tetapi untuk menyelamatkannya.\".... pada ayat Luke 9:56 tidak terdapat dalam manuscript UBS/Westcott and Hort yang digunakan oleh terjemahan LAI TB tetapi terdapat dalam Diatessaron serta manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008)."
        }
    ],
    47: [
        {
            "id": 1,
            "target_ref": "John 16:16",
            "title": "Varian Naskah John 16:16 (\"...karena Aku pergi kepada Bapa\")",
            "text": "Frasa \"...karena Aku pergi kepada Bapa.\" pada ayat John 16:16 tidak terdapat di dalam manuscript UBS/Westcott and Hort yang digunakan oleh terjemahan LAI TB tetapi terdapat dalam Diatessaron serta manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008)"
        }
    ],
    49: [
        {
            "id": 1,
            "target_ref": "Luke 22:68",
            "title": "Varian Naskah Luke 22:68 (\"...ataupun membiarkan pergi\")",
            "text": "Frasa \"...ataupun membiarkan pergi\" pada ayat Luke 22:68 tidak terdapat dalam manuscript UBS/Westcott and Hort yang digunakan oleh terjemahan LAI TB tetapi terdapat dalam Diatessaron serta manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008)"
        }
    ],
    54: [
        {
            "id": 1,
            "target_ref": "Luke 24:42",
            "title": "Varian Naskah Luke 24:42 (\"dan madu lebah\")",
            "text": "Kata \"dan madu lebah\" pada ayat Luke 24:42 tidak terdapat dalam manuscript UBS/Westcott and Hort yang digunakan oleh terjemahan LAI TB tetapi terdapat dalam Diatessaron serta manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008)"
        }
    ],
    55: [
        {
            "id": 1,
            "target_ref": "Luke 24:53",
            "title": "Varian Naskah Luke 24:53 (\"Amin\")",
            "text": "Kata \"Amin\" pada ayat Luke 24:53 tidak terdapat dalam manuscript UBS/Westcott and Hort yang digunakan terjemahan LAI TB tetapi terdapat dalam Diatessaron serta manuscript Textus Receptus (TR) yang digunakan oleh terjemahan MILT (2008)."
        },
        {
            "id": 2,
            "target_ref": "Matthew 28:18",
            "title": "Varian Naskah Matthew 28:18b (Pengutusan)",
            "text": "Kalimat \"Sama seperti Bapa mengutus Aku, demikian juga sekarang Aku mengutus kamu.\" pada ayat Matthew 28:18b hanya terdapat di manuscript Diatessaron, agaknya kalimat ini paralel dengan John 20:21c atau bersumber dari manuscript lain."
        }
    ]
}
