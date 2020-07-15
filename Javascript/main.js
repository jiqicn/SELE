frame = new Frame();
frame.init();

// // co-occurred ss
// var QSeq = [
//     [
//         {state: 's', eid: 1},
//         {state: 's', eid: 2}
//     ], 
//     [
//         {state: 'e', eid: 2}
//     ],
//     [
//         {state: 'e', eid: 1}
//     ]
// ]

// var TSeq = [
//     [
//         {state: 's', eid: 11}
//     ],
//     [
//         {state: 's', eid: 13},
//         {state: 's', eid: 14}
//     ], 
//     [
//         {state: 'e', eid: 144}
//     ],
//     [
//         {state: 'e', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 12}
//     ]
// ]

// // co-occurred se
// var QSeq = [
//     [
//         {state: 's', eid: 1}
//     ],
//     [
//         {state: 's', eid: 2},
//         {state: 'e', eid: 1}
//     ],
//     [
//         {state: 'e', eid: 2}
//     ]
// ]

// var TSeq = [
//     [
//         {state: 's', eid: 11}
//     ],
//     [
//         {state: 's', eid: 12}
//     ],
//     [
//         {state: 's', eid: 13},
//         {state: 'e', eid: 12}
//     ],
//     [
//         {state: 'e', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 11}
//     ]
// ]

// // partial

// var QSeq = [
//     [
//         {state: 's', eid: 1}
//     ],
//     [
//         {state: 's', eid: 2}
//     ],
//     [
//         {state: 'e', eid: 2}
//     ]
// ]

// var TSeq = [
//     [
//         {state: 's', eid: 11}
//     ],
//     [
//         {state: 's', eid: 12}
//     ],
//     [
//         {state: 's', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 12}
//     ],
//     [
//         {state: 'e', eid: 11}
//     ]
// ]

// // parallel

// var QSeq = [
//     [
//         {state: 's', eid: 1}
//     ],
//     [
//         {state: 's', eid: 2}
//     ],
//     [
//         {state: 'e', eid: 1}
//     ], 
//     [
//         {state: 'e', eid: 2}
//     ]
// ]

// var TSeq = [
//     [
//         {state: 's', eid: 11}
//     ],
//     [
//         {state: 's', eid: 12}
//     ],
//     [
//         {state: 's', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 12}
//     ],
//     [
//         {state: 'e', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 11}
//     ]
// ]

// // nested
// var QSeq = [
//     [
//         {state: 's', eid: 1}
//     ],
//     [
//         {state: 's', eid: 2}
//     ],
//     [
//         {state: 'e', eid: 2}
//     ],
//     [
//         {state: 'e', eid: 1}
//     ]
// ]

// var TSeq = [
//     [
//         {state: 'e', eid: 11}
//     ],
//     [
//         {state: 's', eid: 12}
//     ],
//     [
//         {state: 's', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 13}
//     ],
//     [
//         {state: 'e', eid: 12}
//     ],
//     [
//         {state: 's', eid: 14}
//     ],
// ]

// // random test

// var QSeq = [
//     [
//         {state: 's', eid: 3}
//     ],
//     [
//         {state: 's', eid: 4}
//     ],
//     [
//         {state: 'e', eid: 4},
//         {state: 'e', eid: 2}
//     ]
// ];

// var TSeq = [
//     [
//         {state: 's', eid: 1}
//     ],
//     [
//         {state: 's', eid: 2}
//     ],
//     [
//         {state: 's', eid: 3}
//     ],
//     [
//         {state: 's', eid: 4}
//     ],
//     [
//         {state: 'e', eid: 4},
//         {state: 'e', eid: 2}
//     ],
//     [
//         {state: 's', eid: 5}
//     ],
//     [
//         {state: 's', eid: 6}
//     ],
//     [
//         {state: 'e', eid: 6},
//         {state: 'e', eid: 3}
//     ],
//     [
//         {state: 's', eid: 7},
//         {state: 's', eid: 8}
//     ],
//     [
//         {state: 'e', eid: 8}
//     ],
//     [
//         {state: 'e', eid: 5},
//         {state: 'e', eid: 7}
//     ],
//     [
//         {state: 'e', eid: 1}
//     ],
// ];

// var qe = new QueryEngine(QSeq, TSeq);
// console.log(qe.exec());