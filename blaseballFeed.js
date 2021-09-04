// eventSource = new EventSource(`https://api.sibr.dev/replay/v1/replay?from=2020-08-27T01:00:08.17Z`);
var gameId = 0;
var updateTime = 4; //seconds, will control synth beats but also should control game updates 
var updateGamesListFlag = true;
var curseMultiplier = 1;

//attach a click listener to a play button
document.getElementById('startButton').addEventListener('click', () => {initialize()});
document.getElementById('curseButton').addEventListener('click', () => {increaseCurse()});
this.timeGrabber = document.getElementById('startTime');
this.gameGrabber = document.getElementById('gamesOptions');
var dateTemp = new Date(document.getElementById('startTime').value);
this.eventSource = new EventSource(`https://api.sibr.dev/replay/v1/replay?from=${dateTemp.toISOString()}`);
this.eventSource.onmessage = doUpdates;
let self = this;
this.timeGrabber.addEventListener('change', (event) => {

	self.eventSource.close();
	var dateTemp = new Date(event.target.value);
	console.log(dateTemp.toUTCString());
	self.eventSource = new EventSource(`https://api.sibr.dev/replay/v1/replay?from=${dateTemp.toISOString()}&interval=${updateTime*1000}`);
	self.eventSource.onmessage = doUpdates;	
	flipUpdateFlag();
	// self.updateGamesListFlag = true;

});
this.gameGrabber.addEventListener('change', (event) => {
	
	choice = $('#gamesOptions').val();
	setgameId(choice);

});
// this.gameGrabber.addEventListener('change', (event) => {
//
// 	self.gameId = event.target.value;
// });



//synth shit
var allNotes = ["C0","C#0","D0","D#0","E0","F0","F#0","G0","G#0","A0","A#0","B0","C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1","C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2","C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5","C6","C#6","D6","D#6","E6","F6","F#6","G6","G#6","A6","A#6","B6","C7","C#7","D7","D#7","E7","F7","F#7","G7","G#7","A7","A#7","B7","C8","C#8","D8","D#8","E8","F8","F#8","G8","G#8","A8","A#8","B8"];
var majorIdx = [0,2,4,5,7,9,11,12];
var minorIdx = [0,2,3,5,7,8,10,12];
var octaveStep = 12;
var minimumIndex = allNotes.indexOf('C3');
var rootIndex = minimumIndex;

var strikeScaleIdx = [0,3,4,6,7,10,11,13,14]; //ugh, zero indexing. SO this is root, 4th,5th,7th
var ballScaleIdx = [0,2,4,5,6,7,9,11,12,14,16,17,18,19,21+0,21+2,21+4,21+5,21+6,21+7,21+9,21+11,21+12,21+14,21+16,21+17,21+18,21+19,42+0,42+2,42+4,42+5,42+6,42+7,42+9,42+11,42+12,42+14,42+16,42+17,42+18,42+19]; //ugh, zero indexing. SO this is root, 3rd,5th,6th,7th
// var outWigglyFactors = [15,20,50,100]

var filter = new Tone.AutoFilter({
			baseFrequency:'C4',
			frequency: 0,
			depth: 0 
		}).toDestination().start();
// var homeSynth = new Tone.FMSynth().connect(filter);//toDestination();
var awaySynth = new Tone.Synth({
			"volume": 0,
			"detune": 0,
			"portamento": 0.05,
			"envelope": {
				"attack": 1,
				"attackCurve": "exponential",
				"decay": 0.1,
				"decayCurve": "linear",
				"release": 0,
				"releaseCurve": "exponential",
				"sustain": 1
			},
			"oscillator": {
				"partialCount": 0,
				"partials": [],
				"phase": 0,
				"type": "sawtooth",
				"count": 3,
				"spread": 10
			}
		}).connect(filter);
var homeSynth = new Tone.Synth({
			"volume": 0,
			"detune": 0,
			"portamento": 0.05,
			"envelope": {
				"attack": 1,
				"attackCurve": "exponential",
				"decay": 0.1,
				"decayCurve": "linear",
				"release": 0,
				"releaseCurve": "exponential",
				"sustain": 1
			},
			"oscillator": {
				"partialCount": 0,
				"partials": [],
				"phase": 0,
				"type": "square",
				"count": 3,
				"spread": 20
			}
		}).connect(filter);
		
var strikeSynth = new Tone.FMSynth().connect(filter);
strikeSynth.oscillator.type = 'sine';

var posHomeDrumSynth = new Tone.MembraneSynth({
			// pitchDecay: 0.008,
			// octaves: 2,
			// envelope: {
			// 	attack: 0.0006,
			// 	decay: 0.5,
			// 	sustain: 0
			// },
				volume: 7
		}).toDestination();
var negHomeDrumSynth = new Tone.MembraneSynth({//}.toDestination();// {
			pitchDecay: 0.4,
			octaves: 2,
			envelope: {
				attack: 0.0006,
				decay: 0.5,
				sustain: 0
			},
			volume: 7
		}).toDestination();
var homeDrumSynth = new Tone.MembraneSynth().toDestination();		
var homeSpacing = 0;
// var	homeDrumSequence = new Tone.Sequence(((time, pitch) => {
// 			homeDrumSynth.triggerAttack(pitch, time);
// 		}), [allNotes[rootIndex-12]], homeSpacing).start(0);

var lowPass = new Tone.Filter({
		  frequency: 8000,
		}).toDestination();

var posAwayDrumSynth = new Tone.NoiseSynth({
	  volume: -8,
	  noise: {
	    type: 'white',
	    playbackRate: 3
	  },
	  envelope: {
	    attack: 0.03,
	    decay: 0.20,
	    sustain: 0.15,
	    release: 0.001,
	  },
	}).connect(lowPass);
var negAwayDrumSynth = new Tone.NoiseSynth({
	volume: -8,
	noise:{
		playbackRate: 1000,
		type: "pink"
	},
	  envelope: {
	    attack: 0.03,
	    decay: 0.20,
	    sustain: 0.15,
	    release: 0.001,
	  }
	}).toDestination();
var awayDrumSynth = new Tone.NoiseSynth().toDestination();			
var awaySpacing = 0;

// var	awayDrumSequence = new Tone.Sequence(((time) => {
// 			awayDrumSynth.triggerAttack(time);
// 		}),[]).start(0);
		
		
var baseSynth = new Tone.PolySynth({
	"volume": 5,
	"detune": 0,
	"portamento": 0.05,
	"envelope": {
		"attack": 0.005,
		"attackCurve": "linear",
		"decay": 0.1,
		"decayCurve": "exponential",
		"release": 1,
		"releaseCurve": "exponential",
		"sustain": 0.3
	},
	"oscillator": {
		"partialCount": 0,
		"partials": [],
		"phase": 0,
		"type": "triangle"
	}
}).toDestination(); //Should this go through the filter?
		
var baseNotes = [3,5,6,14,17]; //fuck, 4th, 6th, and 7th, sounds like LoZ
		// 467
var baseSequence = new Tone.Sequence((time, note) => {
	synth.triggerAttackRelease(note, .5, time);
}, [],updateTime/2).start(0);

var basepeggio=[];

Tone.Transport.start();	
		
// var allSynths = [inningSynth,strikeSynth,ballSynth];

var ballPattern = new Tone.Pattern(function(time, note){
			strikeSynth.triggerAttackRelease(note, 0.25);
		}, []).start(0);
var ballpeggio = [];

Tone.Transport.start();
function doUpdates(event)
{		
	//TODO: still overlapping on inning change?

	// Tone.Transport.stop();
    var snapshots = digestSnapshots(event);
	if (updateGamesListFlag)
	{
		updateGamesList(snapshots);
		if (findSnapshotById(snapshots,gameId)===-1)
		{
			gameId = snapshots[0].id;
		}
		gameGrabber.value = gameId;
		updateGamesListFlag = false;
	}
	
	var snapshot = getSnapshotById(snapshots,gameId);
	if (Tone.context.state === "running" && snapshot.inning>-1)
	{
		Tone.Transport.cancel();

		
		if (snapshot.topOfInning)
		{
			strikeSynth = awaySynth;
		}
		else
		{
			strikeSynth = homeSynth;
		}
		rootIndex = minimumIndex+snapshot.inning;
		if (snapshot.homeScore == 0)
		{
			homeSpacing = 0;
		} //will never play?
		else
		{ 
			homeSpacing = updateTime/(Math.abs(snapshot.homeScore));
			if (snapshot.homeScore<0)
			{
				// homeDrumSynth = negHomeDrumSynth;
				var homeDrumSequence = new Tone.Sequence(((time, pitch) => {
					negHomeDrumSynth.triggerAttack(pitch, time);
				}), [allNotes[rootIndex-24]], homeSpacing).start(0);
			}
			else
			{
				// homeDrumSynth = posHomeDrumSynth;
				var homeDrumSequence = new Tone.Sequence(((time, pitch) => {
					posHomeDrumSynth.triggerAttack(pitch, time);
				}), [allNotes[rootIndex-24]], homeSpacing).start(0);				
			}

		}
		if (snapshot.awayScore == 0)
		{
			awaySpacing = 0;
		} //will never play?
		else
		{
			awaySpacing = updateTime/(Math.abs(snapshot.awayScore));
			if (snapshot.awayScore<0)
			{
				// awayDrumSynth = negAwayDrumSynth;
				var awayDrumSequence = new Tone.Sequence(((time,pitch) => {
					negAwayDrumSynth.triggerAttack(time);
					negAwayDrumSynth.triggerRelease(time+.23);					
				}),[1],[awaySpacing]).start(0); //1 is just a bs placeholder
				// awayDrumSequence = new Tone.Sequence(((time,pitch) => {
				// 	awayDrumSynth.triggerAttack(pitch,time);
				// }), [allNotes[rootIndex+12]],[awaySpacing]).start(0);
			}
			else
			{
				// awayDrumSynth = posAwayDrumSynth;
				var awayDrumSequence = new Tone.Sequence(((time,pitch) => {
					posAwayDrumSynth.triggerAttack(time);
					posAwayDrumSynth.triggerRelease(time+.23);
				}),[1],[awaySpacing]).start(0); //1 is just a bs placeholder
			}
		}			
	
		filter.set({
			frequency: 100*Math.tanh(snapshot.outs/13),
			depth: Math.tanh(snapshot.outs/(3*curseMultiplier))
		});
		// strikeSynth.triggerAttack();
	
		ballpeggio = [];
		for (var idx=0;idx<2**snapshot.balls;idx++)
		{
			ballpeggio.push(allNotes[rootIndex+getMajorIdx(strikeScaleIdx[snapshot.strikes])+getMajorIdx(ballScaleIdx[idx])]);
		}
		ballPattern = new Tone.Pattern(function(time, note){
			strikeSynth.triggerAttackRelease(note, updateTime/(2**snapshot.balls));
		}, ballpeggio);
		ballPattern.start(0);
	
		basepeggio = [];
		snapshot.basesOccupied.sort();
		for (var idx=0;idx<snapshot.basesOccupied.length;idx++)
			{basepeggio.push(allNotes[rootIndex+getMajorIdx(baseNotes[snapshot.basesOccupied[idx]])]);}

		baseSequence = new Tone.Sequence((time, note) => {
			baseSynth.triggerAttackRelease(note, .5, time);
		}, basepeggio,updateTime/(2*basepeggio.length)).start(0);
	
		baseSequence.start(0);
		console.log('|~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|')				
		// console.log(snapshot.awayTeamNickname+' at ' + snapshot.homeTeamNickname);
		console.log('inning: '+(snapshot.inning+1));				
		console.log('strikes: '+snapshot.strikes);
		console.log('balls: '+snapshot.balls);
		console.log('outs: '+snapshot.outs);
		console.log('bases: '+snapshot.basesOccupied);
		console.log('homeScore: '+snapshot.homeScore);
		console.log('awayScore: '+snapshot.awayScore);

		Tone.Transport.start();
	}
}
function getMajorIdx(scaleIdx)
{
	let baseIdx = [0,2,4,5,7,9,11,12];
	let scaleInBase = scaleIdx%8;	//Get scaleIdx as scale degree without octave
	let noteInBase = baseIdx[scaleInBase]; //Get note index in base octave
	return noteInBase + Math.floor(scaleIdx/8)*12; //Add in octave info
}
function getMinorIdx(scaleIdx)
{
	let baseIdx = [0,2,3,5,7,8,10,12];
	let scaleInBase = scaleIdx%8;	//Get scaleIdx as scale degree without octave
	let noteInBase = baseIdx[scaleInBase];
	return noteInBase + Math.floor(scaleIdx/8)*12;
}
function updateGamesList(allSnapshots)
{
	var away = '';
	var home = '';
	var str = '';
	$('#gamesOptions').empty();
	for (var idx=0;idx<allSnapshots.length;idx++)
	{
		away = allSnapshots[idx].awayTeamNickname;
		home = allSnapshots[idx].homeTeamNickname;
		str = `${away} at ${home}`;

		$('#gamesOptions').append($('<option></option>').val(allSnapshots[idx].id).html(str));
	}
}
function flipUpdateFlag()
{
	updateGamesListFlag= true;
}
function setgameId(choice)
{
	gameId = choice;
}
function initialize()
{
	Tone.start();
	var trashSynth = new Tone.Synth();
	trashSynth.triggerAttack();
}
function increaseCurse()
{
	curseMultiplier = 2;
	filter = new Tone.Vibrato({
				// baseFrequency:'C4',
				frequency: 0,
				depth: 0 
			}).toDestination();
	
	awaySynth = new Tone.Synth({
				"volume": 0,
				"detune": 0,
				"portamento": 0.05,
				"envelope": {
					"attack": 1,
					"attackCurve": "exponential",
					"decay": 0.1,
					"decayCurve": "linear",
					"release": 0,
					"releaseCurve": "exponential",
					"sustain": 1
				},
				"oscillator": {
					"partialCount": 0,
					"partials": [],
					"phase": 0,
					"type": "fatsawtooth",
					"count": 3,
					"spread": 10
				}
			}).connect(filter);
	homeSynth = new Tone.Synth({
				"volume": 0,
				"detune": 0,
				"portamento": 0.05,
				"envelope": {
					"attack": 1,
					"attackCurve": "exponential",
					"decay": 0.1,
					"decayCurve": "linear",
					"release": 0,
					"releaseCurve": "exponential",
					"sustain": 1
				},
				"oscillator": {
					"partialCount": 0,
					"partials": [],
					"phase": 0,
					"type": "fatsquare",
					"count": 3,
					"spread": 20
				}
			}).connect(filter);
			
	
}
function convertTime()
{
	
}
// const bell = new Tone.MetalSynth({
// 			harmonicity: 12,
// 			resonance: 800,
// 			modulationIndex: 20,
// 			envelope: {
// 				decay: 0.4,
// 			},
// 			volume: -15
// 		}).toDestination();
//
// 		const bellPart = new Tone.Sequence(((time, freq) => {
// 			bell.triggerAttack(freq, time, Math.random()*0.5 + 0.5);
// 		}), [[300, null, 200],
// 			[null, 200, 200],
// 			[null, 200, null],
// 			[200, null, 200]
// 		], "4n").start(0);
//
// 		const conga = new Tone.MembraneSynth({
// 			pitchDecay: 0.008,
// 			octaves: 2,
// 			envelope: {
// 				attack: 0.0006,
// 				decay: 0.5,
// 				sustain: 0
// 			}
// 		}).toDestination();
//
// 		const congaPart = new Tone.Sequence(((time, pitch) => {
// 			conga.triggerAttack(pitch, time, Math.random()*0.5 + 0.5);
// 		}), ["G3", "C4", "C4", "C4"], "4n").start(0);
//
// 		Tone.Transport.bpm.value = 115;
//
// 		drawer().add({
// 			tone: conga,
// 			title: "Conga"
// 		}).add({
// 			tone: bell,
// 			title: "Bell"
// 		});
//
// 		// connect the UI with the components
// 		document.querySelector("tone-play-toggle").addEventListener("start", () => Tone.Transport.start());
// 		document.querySelector("tone-play-toggle").addEventListener("stop", () => Tone.Transport.stop());
//