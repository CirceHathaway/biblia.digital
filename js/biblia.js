import { libros } from './libros.js';

const dropdown = document.getElementById("selector-libro");
const dropdownToggle = document.getElementById("selector-toggle");
const dropdownContent = document.getElementById("selector-content");
const versiculosDiv = document.getElementById("versiculos");
const btnAumentar = document.getElementById("aumentarLetra");
const btnAnterior = document.getElementById("anteriorCapitulo");
const btnSiguiente = document.getElementById("siguienteCapitulo");

let libroActual = null;
let capitulos = [];
let capituloSelectIndex = 0;
let versiculoSelectIndex = 0;
let fontSize = 18;
let estadoSelector = "libros";
let libroSeleccionado = "";

let pressTimer;
let mouseMoved = false;
let touchMoved = false;

const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Lista predefinida de versículos destacados para el versículo del día
const versiculosDestacados = [
  { libro: "S.Juan", capitulo: 3, versiculo: 16, texto: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna." },
  { libro: "Salmos", capitulo: 23, versiculo: 1, texto: "Jehová es mi pastor; nada me faltará." },
  { libro: "Filipenses", capitulo: 4, versiculo: 13, texto: "Todo lo puedo en Cristo que me fortalece." },
  { libro: "Proverbios", capitulo: 3, versiculo: 5, texto: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia." },
  { libro: "S.Mateo", capitulo: 11, versiculo: 28, texto: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar." },
  { libro: "Proverbios", capitulo: 10, versiculo: 12, texto: "El odio despierta rencillas; Pero el amor cubrirá todas las faltas." },
  { libro: "Salmos", capitulo: 46, versiculo: 1, texto: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones." },
  { libro: "S.Juan", capitulo: 14, versiculo: 1, texto: "No se turbe vuestro corazón; creéis en Dios, creed también en mí." },
  { libro: "S.Mateo", capitulo: 22, versiculo: 39, texto: "Amarás a tu prójimo como a ti mismo." },
  { libro: "Salmos", capitulo: 121, versiculo: 2, texto: "Mi socorro viene de Jehová que hizo los cielos y la tierra." },
  { libro: "S.Mateo", capitulo: 7, versiculo: 8, texto: "Porque todo aquel que pide, recibe; y el que busca, halla; y al que llama se le abrirá." },
  { libro: "Salmos", capitulo: 120, versiculo: 1, texto: "A Jehová clamé estando en angustia, y El me respondió." },
  { libro: "Proverbios", capitulo: 20, versiculo: 22, texto: "No digas: Yo me vengaré; espera en Jehová y él te salvará." },
  { libro: "Salmos", capitulo: 37, versiculo: 11, texto: "Pero los mansos heredarán la tierra, Y se recrearán con abundancia de paz." },
  { libro: "S.Mateo", capitulo: 5, versiculo: 37, texto: "Pero vuestro hablar sea; si, si; no, no, porque lo que es más de esto de mal procede." },
  { libro: "Salmos", capitulo: 37, versiculo: 3, texto: "Confía en Jehová y haz el bien; Y habitarás en la tierra, y te apacentarás de la verdad." },
  { libro: "S.Juan", capitulo: 15, versiculo: 7, texto: "Si permanecéis en mí, y mis palabras permanecen en vosotros, pedid todo lo que queréis, y os será hecho." },
  { libro: "Isaias", capitulo: 40, versiculo: 29, texto: "El da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas." },
  { libro: "Lamentaciones", capitulo: 3, versiculo: 24, texto: "Mi porción es Jehová, dijo mi alma; por tanto, en él esperaré." },
  { libro: "Proverbios", capitulo: 11, versiculo: 25, texto: "El alma generosa será prosperada; Y el que saciare, él también será saciado." },
  { libro: "Salmos", capitulo: 19, versiculo: 14, texto: "Sean gratos los dichos de mi boca y la meditación de mi corazón delante de ti, Oh Jehová, roca mía, y redentor mío." },
  { libro: "S.Mateo", capitulo: 7, versiculo: 7, texto: "Pedid y se os dará; buscad y hallareis; llamad, y se os abrirá." },
  { libro: "S.Mateo", capitulo: 5, versiculo: 8, texto: "Bienaventurados los de limpio corazón, porque ellos verán a Dios." },
  { libro: "Apocalipsis", capitulo: 2, versiculo: 17, texto: "El que tiene oído, oiga lo que el Espíritu dice a las iglesia. Al que venciere, daré a comer del maná escondido, y le daré una piedrecita blanca, y en la piedrecita escrito un nombre nuevo, el cual ninguno conoce sino aquel que lo recibe." },
  { libro: "Salmos", capitulo: 34, versiculo: 15, texto: "Los ojos de Jehová están sobre los justos, y atentos sus oídos al clamor de ellos." },
  { libro: "S.Mateo", capitulo: 11, versiculo: 29, texto: "Llevad mi yugo sobre vosotros, y aprended de mí, que soy manso y humilde de corazón; y hallaréis descanso para vuestras almas." },
  { libro: "Génesis", capitulo: 18, versiculo: 14, texto: "¿Hay para Dios alguna cosa difícil?" },
  { libro: "1 Corintios", capitulo: 3, versiculo: 7, texto: "Así que ni el que planta es algo, ni el que riega, sino Dios, que da el crecimiento." },
  { libro: "Colosenses", capitulo: 1, versiculo: 27, texto: "...es Cristo en vosotros, la esperanza de gloria." },
  { libro: "Salmos", capitulo: 32, versiculo: 7, texto: "Tu eres mi refugio; me guardarás de la angustia." },
  { libro: "Salmos", capitulo: 34, versiculo: 19, texto: "Muchas son las aflicciones del justo, pero de todas ellas lo librará Jehová." },
  { libro: "1 Crónicas", capitulo: 22, versiculo: 13, texto: "Entonces serás prosperado, si cuidares de poner por obra los estatutos y decretos que Jehová mandó a Moisés para Israel. Esfuérzate, pues, y cobra ánimo; no temas, ni desmayes." },
  { libro: "Salmos", capitulo: 37, versiculo: 27, texto: "Apártate del mal, y haz el bien, y vivirás para siempre." },
  { libro: "S.Juan", capitulo: 5, versiculo: 24, texto: "De cierto, de cierto os digo: El que oye mi palabra, y cree al que me envió, tiene vida eterna; y no vendrá a condenación, mas ha pasado de muerte a vida." },
  { libro: "Job", capitulo: 22, versiculo: 25, texto: "El todopoderoso será tu defensa, y tendrás plata en abundancia." },
  { libro: "S.Mateo", capitulo: 5, versiculo: 9, texto: "Bienaventurado los pacificadores, porque ellos serán llamados Hijos de Dios." },
  { libro: "S.Mateo", capitulo: 5, versiculo: 5, texto: "Bienaventurados los mansos, porque ellos recibirán la tierra por heredad." },
  { libro: "Salmos", capitulo: 15, versiculo: 1-2, texto: "¿Quién morará en tu monte santo? El que anda en integridad y hace justicia, y habla verdad en su corazón." },
  { libro: "Apocalipsis", capitulo: 3, versiculo: 5, texto: "El que venciere será vestido de vestiduras blancas; y no borraré su nombre del libro de la vida, y confesaré su nombre delante de mi Padre, y delante de sus ángeles." },
  { libro: "Salmos", capitulo: 32, versiculo: 8, texto: "Te haré entender, y te enseñaré el camino en que debes andar; Sobre ti fijaré mis ojos." },
  { libro: "Salmos", capitulo: 32, versiculo: 10, texto: "Muchos dolores habrá para el impío; Mas al que espera en Jehová, le rodea la misericordia." },
  { libro: "Proverbios", capitulo: 24, versiculo: 1, texto: "No tengas envidia de los hombres malos, ni desees estar con ellos." },
  { libro: "Romanos", capitulo: 8, versiculo: 33, texto: "¿Quién acusará a los escogidos de Dios? Dios es el que justifica." },
  { libro: "Salmos", capitulo: 73, versiculo: 1, texto: "Ciertamente es bueno Dios para con los limpios de corazón." },
  { libro: "Salmos", capitulo: 145, versiculo: 20, texto: "Jehová guarda a todos los que le aman, Mas destruirá a todos los impíos." },
  { libro: "Salmos", capitulo: 84, versiculo: 10, texto: "Porque mejor es un día en tus atrios que mil fuera de ellos. Escogería antes estar a la puerta de la casa de mi Dios, que habitar en las moradas de maldad." },
  { libro: "Salmos", capitulo: 16, versiculo: 11, texto: "Me mostrarás la senda de la vida; En tu presencia hay plenitud de gozo; Delicias a tu diestra para siempre." },
  { libro: "S.Marcos", capitulo: 16, versiculo: 15, texto: "Id por todo el mundo y predicad el evangelio a toda criatura." },
  { libro: "Santiago", capitulo: 1, versiculo: 6, texto: "Pero pide con fe, no dudando nada; porque el que duda es semejante a la onda del mar, que es arrastrada por el viento y echada de una parte a otra." },
  { libro: "Salmos", capitulo: 60, versiculo: 12, texto: "En Dios haremos proezas, Y él hollará a nuestros enemigos." },
  { libro: "Esdras", capitulo: 8, versiculo: 22, texto: "La mano de nuestro Dios es para bien sobre todos los que le buscan." },
  { libro: "Salmos", capitulo: 71, versiculo: 24, texto: "Mi lengua hablará también de tu justicia todo el día; Por cuanto han sido avergonzados, porque han sido confundidos los que mi mal procuraban." },
  { libro: "Salmos", capitulo: 94, versiculo: 19, texto: "En la multitud de mis pensamientos dentro de mí, Tus consolaciones alegraban mi alma." },
  { libro: "Salmos", capitulo: 139, versiculo: 16, texto: "Tus ojos vieron mi cuerpo en gestación: todo estaba ya escrito en tu libro; todos mis días se estaban diseñando, aunque no existía uno solo de ellos." },
  { libro: "Salmos", capitulo: 33, versiculo: 11, texto: "El consejo de Jehová permanecerá para siempre; Los pensamientos de su corazón por todas las generaciones." },
  { libro: "Isaias", capitulo: 9, versiculo: 6, texto: "Porque nos ha nacido un niño, se nos ha concedido un hijo; la soberanía reposará sobre sus hombros y se le darán estos nombres: Consejero Admirable, Dios Fuerte, Padre Eterno, Principe de Paz." },
  { libro: "Isaias", capitulo: 6, versiculo: 8, texto: "Entonces oí la voz del Señor que decía: ¿A quién enviaré? ¿Quién irá por nosotros? Y respondí: Aquí estoy. ¡Envíame a mí!." },
  { libro: "Salmos", capitulo: 90, versiculo: 12, texto: "Enséñanos a contar bien nuestros días, para que nuestro corazón adquiera sabiduría." },
  { libro: "Salmos", capitulo: 1, versiculo: 3, texto: "Es como el árbol plantado a la orilla de un río que, cuando llega su tiempo, da fruto y sus hojas se marchitan. Todo cuanto hace prospera." },
  { libro: "S.Juan", capitulo: 20, versiculo: 9, texto: "Jesús le dijo: Porque me has visto, Tomás, creíste; bienaventurados los que no vieron, y creyeron." },
  { libro: "S.Juan", capitulo: 17, versiculo: 26, texto: "Yo les he dado a conocer tu nombre y seguiré haciéndolo, para que el amor con que me has amado esté en ellos y yo mismo esté en ellos." },
  { libro: "S.Juan", capitulo: 16, versiculo: 33, texto: "Yo les dije esto para que encuentren paz en mí. En el mundo ustedes tendrán que sufrir, pero, ¡sean valientes! Yo he vencido al mundo." },
  { libro: "S.Juan", capitulo: 16, versiculo: 13, texto: "Pero cuando venga el Espíritu de la verdad, él los guiará a toda la verdad, porque no hablará por su propia cuenta, sino que dirá solo lo que oiga y les anunciará las cosas por venir" },
  { libro: "S.Juan", capitulo: 15, versiculo: 9, texto: "Yo los he amado como me ama mi Padre. Permanezcan en mi amor." },
  { libro: "S.Juan", capitulo: 13, versiculo: 7, texto: "Respondió Jesús y le dijo: Lo que yo hago, tú no lo comprendes ahora; mas lo entenderás después." },
  { libro: "S.Juan", capitulo: 12, versiculo: 26, texto: "Quien quiera servirme debe seguirme; y donde yo esté, allí también estará mi siervo. A quien me sirva, mi Padre lo honrará." },
  { libro: "S.Juan", capitulo: 10, versiculo: 10, texto: "El ladrón no viene más que a robar, matar y destruir; yo he venido para que tengan vida y la tengan en abundancia." },
  { libro: "S.Juan", capitulo: 8, versiculo: 32, texto: "Conocerán la verdad, y la verdad los hará libres." },
  { libro: "S.Juan", capitulo: 4, versiculo: 14, texto: "Pero el que beba del agua que yo le daré no volverá a tener sed jamás, sino que dentro de él esa agua se convertirá en un manantial del que brotará vida eterna." },
  { libro: "S.Juan", capitulo: 1, versiculo: 14, texto: "Y el verbo se hizo hombre y habitó entre nosotros. Y contemplamos su gloria, la gloria que corresponde al Hijo único del Padre, lleno de gracia y de verdad." },
  { libro: "S.Lucas", capitulo: 24, versiculo: 5, texto: "Las mujeres tenían mucho miedo y se postraron rostro en tierra. Los hombres les dijieron: '¿Por qué están buscando entre los muertos al que está vivo?'" },
  { libro: "Isaias", capitulo: 53, versiculo: 5, texto: "Pero Él fue herido por nuestras transgresiones, Molido por nuestras iniquidades. El castigo, por nuestra paz, cayó sobre Él, Y por sus heridas hemos sido sanados." },
  { libro: "S.Lucas", capitulo: 22, versiculo: 19, texto: "También tomó pan y, después de dar las gracias, lo partió, se lo dio a ellos y dijo: Esto es mi cuerpo, entregado por ustedes; hagan esto en memoria de mí." },
  { libro: "Romanos", capitulo: 15, versiculo: 5, texto: "Que el Dios que da la perseverancia y el aliento os conceda vivir en armonía los unos con los otros, según Cristo Jesús, para que a una sola voz glorifiquéis al Dios y Padre de nuestro Señor Jesucristo." },
  { libro: "Romanos", capitulo: 13, versiculo: 14, texto: "Mejor, revístanse con el Señor Jesucristo y no piensen, como piensa todo el mundo, en satisfacer sus propios deseos." },
  { libro: "Romanos", capitulo: 12, versiculo: 11-12, texto: "No sean perezosos en lo que requiere diligencia. Sean fervientes en espíritu, sirviendo al Señor; gozándose en la esperanza, perseverando en el sufrimiento, dedicados a la oración." },
  { libro: "Éxodo", capitulo: 35, versiculo: 31, texto: "Y lo ha llenado del Espíritu de Dios, de sabiduría, inteligencia y capacidad creativa." },
  { libro: "Isaias", capitulo: 12, versiculo: 2, texto: "¡Dios es mi salvación! Confiaré en él y no temeré. El Señor es mi fuerza, el Señor es mi canción; ¡él es mi salvación!" },
  { libro: "Efesios", capitulo: 2, versiculo: 10, texto: "Nosotros somos obra de Dios, creados en Jesucristo para realizar las buenas obras que Dios ya planeó de antemano para que nos ocupáramos de ellas." },
  { libro: "Efesios", capitulo: 1, versiculo: 13, texto: "En él también ustedes, cuando oyeron el mensaje de la verdad, el evangelio que les trajo la salvación, y lo creyeron, fueron marcados con el sello que es el Espíritu Santo prometido." },
  { libro: "Jeremías", capitulo: 32, versiculo: 40, texto: "Yo haré con ellos un pacto eterno de hacerles siempre el bien y pondré en su corazón tal respeto por mí que nunca se alejarán de mi lado." },
  { libro: "Salmos", capitulo: 51, versiculo: 10, texto: "Crea en mí, oh Dios, un corazón limpio y renueva un espíritu firme dentro de mi." },
  { libro: "Salmos", capitulo: 139, versiculo: 5, texto: "Tu protección me envuelve por completo; me cubres con la palma de tu mano." },
  { libro: "S.Juan", capitulo: 1, versiculo: 12, texto: "Mas a cuantos lo recibieron, a los que creen en su nombre, les dio el derecho de ser hijos de Dios." },
  { libro: "Éxodo", capitulo: 14, versiculo: 14, texto: "Ustedes quédense quietos, que el Señor presentará batalla por ustedes." },
  { libro: "Colosenses", capitulo: 1, versiculo: 13, texto: "Dios nos rescató del poder de la oscuridad y nos hizo entrar al reino de su Hijo amado." },
  { libro: "S.Juan", capitulo: 11, versiculo: 40, texto: "¿No te dije que si crees verás la gloria de Dios? le contestó Jesús." },
  { libro: "1 Corintios", capitulo: 13, versiculo: 4, texto: "El amor es paciente, es bondadoso. El amor no es envidioso ni presumido ni orgulloso." },
  { libro: "S.Juan", capitulo: 15, versiculo: 2, texto: "Toda rama que en mí no da fruto la corta; pero toda rama que da fruto la poda para que dé más fruto todavía." },
  { libro: "Deuteronomio", capitulo: 3, versiculo: 22, texto: "No les teman, porque el Señor su Dios está peleando por ustedes." },
  { libro: "Isaias", capitulo: 64, versiculo: 8, texto: "Ahora pues, Jehová, tú eres nuestro padre; nosotros barro, y tú el que nos formaste; así que obra de tus manos somos todos nosotros." },
  { libro: "Gálatas", capitulo: 6, versiculo: 9, texto: "No nos cansemos de hacer el bien, porque a su debido tiempo cosecharemos si no nos damos por vencidos." },
  { libro: "Génesis", capitulo: 28, versiculo: 15, texto: "Mira, estoy contigo, te protegeré donde quiera que vayas y te volveré a traer a esta tierra. No te abandonaré y cumpliré lo que te acabo de decir." },
  { libro: "S.Juan", capitulo: 7, versiculo: 38, texto: "De aquel que cree en mí, como dice la Escritura, de su interior brotarán ríos de agua viva." },
  { libro: "Santiago", capitulo: 1, versiculo: 2-3, texto: "Hermanos míos, considérense muy dichosos cuando tengan que enfrentarse con diversas pruebas, pues ya saben que la prueba de su fe produce perseverancia." },
  { libro: "Salmos", capitulo: 121, versiculo: 7-8, texto: "Jehová te guardará de todo mal; Él guardará tu alma. Jehová guardará tu salida y tu entrada desde ahora y para siempre." },
  { libro: "Proverbios", capitulo: 16, versiculo: 3, texto: "Pon todo lo que hagas en manos del Señor, y tus planes tendrán éxito." },
  { libro: "1 Juan", capitulo: 3, versiculo: 24, texto: "El que obedece sus mandamientos permanece en Dios y Dios en él. ¿Cómo sabemos que él permanece en nosotros? Por el Espíritu que nos dio." },
  { libro: "Romanos", capitulo: 5, versiculo: 8, texto: "Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros." },
  { libro: "S.Juan", capitulo: 1, versiculo: 16, texto: "De su plenitud todos recibimos gracia sobre gracia." },
  { libro: "S.Marcos", capitulo: 4, versiculo: 22, texto: "Porque no hay nada oculto que no llegue a descubrise, ni nada encubierto que no salga a la luz pública." },
  { libro: "Proverbios", capitulo: 9, versiculo: 12, texto: "Si eres sabio, lo eres para tu propio bienestar; pero si eres arrogante, sólo tú sufrirás las consecuencias." },
  { libro: "Hebreos", capitulo: 6, versiculo: 19, texto: "La cual tenemos como segura y firme ancla del alma, y que penetra hasta dentro del velo." },
  { libro: "Salmos", capitulo: 119, versiculo: 114, texto: "Mi escudero y mi escudo eres tú; en tu palabra he esperado." },
  { libro: "Salmos", capitulo: 52, versiculo: 8, texto: "Pero yo estoy como olivo verde en la casa de Dios; En la misericordia de Dios confio eternamente y para siempre." },
  { libro: "Salmos", capitulo: 42, versiculo: 5, texto: "¿Por qué te abates, oh alma mía y te turbas dentro de mí? Espera en Dios; porque aún he de alabarle, Salvación mía y Dios mío." },
  { libro: "Romanos", capitulo: 15, versiculo: 13, texto: "Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo." },
  { libro: "Jeremías", capitulo: 29, versiculo: 11, texto: "Porque Yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis." },
  { libro: "Isaias", capitulo: 41, versiculo: 13, texto: "Porque Yo Jehová soy tu Dios, quien te sostiene de tu mano derecha, y te dice: No temas, Yo te ayudo." },
  { libro: "Jeremías", capitulo: 32, versiculo: 27, texto: "He aquí que yo soy Jehová, Dios de toda carne; ¿habrá algo que sea dificil para mi?" },
  { libro: "Salmos", capitulo: 67, versiculo: 1, texto: "Dios tenga misericordia de nosotros, y nos bendiga; Haga resplandecer su rostro sobre nosotros:Selah." },
  { libro: "Salmos", capitulo: 57, versiculo: 1, texto: "Ten misericordia de mí, oh Dios, ten misericordia de mí; Porque en ti ha confiado mi alma, Y en la sombra de tus alas me ampararé Hasta que pasen los quebrantos." },
  { libro: "Salmos", capitulo: 89, versiculo: 34, texto: "No olvidaré mi pacto, Ni mudaré lo que ha salido de mis labios." },
  { libro: "1 Pedro", capitulo: 1, versiculo: 16, texto: "Porque escrito está: Sed santos, porque Yo soy santo." },
  { libro: "Salmos", capitulo: 86, versiculo: 5, texto: "Porque tú, Señor, eres bueno y perdonador, Y grande en misericordia para con todos los que te invocan." },
  { libro: "Salmos", capitulo: 63, versiculo: 7, texto: "Porque has sido mi socorro, Y así en la sombra de tus alas me regocijaré." },
  { libro: "1 Corintios", capitulo: 3, versiculo: 16, texto: "¿No sabéis que sois templo de Dios, y que el Espíritu de Dios mora en vosotros?." },
  { libro: "1 Tesalonicenses", capitulo: 5, versiculo: 16, texto: "Estad siempre gozosos." },
  { libro: "Habacuc", capitulo: 2, versiculo: 3, texto: "Aunque la visión tardará aún por un tiempo, mas se apresura hacia el fin, y no mentirpa; aunque tardare, espéralo, porque sin duda vendrá, no tardará." },
  { libro: "Salmos", capitulo: 62, versiculo: 5, texto: "Alma mía, en Dios solamente reposa, Porque de él es mi esperanza." },
  { libro: "Salmos", capitulo: 23, versiculo: 3, texto: "Confortará mi alma; Me guiará por sendas de justicia por amor de su Nombre." },
  { libro: "Filipenses", capitulo: 4, versiculo: 7, texto: "Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo jesús." },
  { libro: "Salmos", capitulo: 5, versiculo: 11, texto: "Pero alégrense todos los que en ti confían." },
  { libro: "Salmos", capitulo: 34, versiculo: 22, texto: "Jehová redime el alma de sus siervos, Y no serán condenados cuantos en Él confian." },
  { libro: "Salmos", capitulo: 50, versiculo: 15, texto: "E invócame en el día de la angustia; te libraré, y tú me honrarás." },
  { libro: "Proverbios", capitulo: 31, versiculo: 25, texto: "Fuerza y honor son su vestidura; Y se ríe de lo por venir." },
  { libro: "Salmos", capitulo: 119, versiculo: 11, texto: "En mi corazón he guardado tus dichos, Para no pecar contra ti." },
  { libro: "Salmos", capitulo: 18, versiculo: 16, texto: "Envió desde lo alto; me tomó, Me sacó de las muchas aguas." },
  { libro: "2 Tesalonicenses", capitulo: 3, versiculo: 3, texto: "Pero fiel es el Señor, que os afirmará y guardará del mal." },
  { libro: "S.Lucas", capitulo: 1, versiculo: 47, texto: "y mi espíritu se regocija en Dios mi salvador." },
  { libro: "Filipenses", capitulo: 4, versiculo: 12, texto: "Sé vivir humildemente, y sé tener abundancia; en todo y por todo estoy enseñado, así para estar saciado como para tener hambre, así para tener abundancia como para padecer necesidad" },
  { libro: "Salmos", capitulo: 19, versiculo: 7, texto: "La ley de Jehová es perfecta, que convierte el alma; El testimonio de Jehová es fiel, que hace sabio al sencillo." },
  { libro: "Salmos", capitulo: 19, versiculo: 8, texto: "Los mandamientos de Jehová son rectos, que alegran el corazón; El precepto de Jehová es puro, que alumbra los ojos." },
  { libro: "Salmos", capitulo: 19, versiculo: 9, texto: "El temor de Jehová es limpio, que permanece para siempre, Los juicios de Jehová son verdad, todos justos." },
  { libro: "Salmos", capitulo: 19, versiculo: 10, texto: "Deseables son más que el oro, y más que mucho oro afinado; Y dulces más que miel, y que la que destila del panal." },
  { libro: "S.Juan", capitulo: 14, versiculo: 2, texto: "En la casa de mi Padre mucha moradas hay; si así no fuera, yo os lo hubiera dicho; voy, pues, a preparar lugar para vosotros." },
  { libro: "Hebreos", capitulo: 13, versiculo: 2, texto: "No os olvidéis de la hospitalidad, porque por ella algunos, sin saberlo, hospedaron ángeles." },
  { libro: "Hebreos", capitulo: 13, versiculo: 5, texto: "Sean vuestras costumbres sin avaricia, contentos con lo que tenéis ahora; porque él dijo: No te desampararé, ni te dejaré;" },
  { libro: "Hebreos", capitulo: 13, versiculo: 7, texto: "Acordaos de vuestros pastores, que os hablaron la palabra de Dios; considerad cuál haya sido el resultado de su conducta, e imitad su fe." },
  { libro: "Hebreos", capitulo: 13, versiculo: 17, texto: "Obedeced a vuestros pastores, y sujetaos a ellos; porque ellos velan por vuestras almas, como quienes han de dar cuenta; para que lo hagan con alegría, y no quejándose, porque esto no os es provechoso." },
];

// Obtener o generar un identificador único por dispositivo
function obtenerIdentificadorDispositivo() {
  let idDispositivo = localStorage.getItem('deviceId');
  if (!idDispositivo) {
    idDispositivo = Math.random().toString(36).substr(2, 9) + navigator.userAgent.hashCode(); // Combinación única
    localStorage.setItem('deviceId', idDispositivo);
  }
  return idDispositivo;
}

// Extensión de String para hashCode (simplificado)
String.prototype.hashCode = function() {
  let hash = 0;
  if (this.length === 0) return hash;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32 bits
  }
  return hash;
};

// Obtener el versículo del día basado en la fecha y el dispositivo
function obtenerVersiculoDelDia() {
  const hoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const idDispositivo = obtenerIdentificadorDispositivo();
  const semilla = hoy.split('-').reduce((acc, num) => acc + parseInt(num), 0) + idDispositivo.hashCode(); // Semilla única
  const indice = Math.abs(semilla) % versiculosDestacados.length; // Índice determinista y único por dispositivo
  return versiculosDestacados[indice];
}

// Mostrar la ventana del versículo del día si es la primera visita del día
function mostrarVersiculoDelDia() {
  const hoy = new Date().toISOString().split('T')[0];
  const ultimaVisita = localStorage.getItem('lastVisitDate');

  if (ultimaVisita !== hoy) {
    const versiculo = obtenerVersiculoDelDia();
    const ventana = document.createElement('div');
    ventana.className = 'versiculo-dia';

    const palabras = versiculo.texto.split(' ');
    let linea1 = '', linea2 = '';
    const mitad = Math.ceil(palabras.length / 2);
    linea1 = palabras.slice(0, mitad).join(' ');
    linea2 = palabras.slice(mitad).join(' ');

    ventana.innerHTML = `
      <div class="contenido">
        <h3>Versículo del día</h3>
        <p class="texto-versiculo">${linea1}<br>${linea2}</p>
        <p class="referencia">${versiculo.libro} ${versiculo.capitulo}:${versiculo.versiculo}</p>
        <div class="botones">
          <button id="btn-compartir-dia">Compartir</button>
          <button id="btn-copiar-dia">Copiar</button>
          <button id="btn-cerrar-dia">Cerrar</button>
        </div>
      </div>
    `;
    document.body.appendChild(ventana);

    document.getElementById('btn-compartir-dia').addEventListener('click', () => {
      compartirVersiculoComoImagen(versiculo.libro, versiculo.capitulo, versiculo.versiculo, versiculo.texto, true);
      localStorage.setItem('lastVisitDate', hoy);
      document.body.removeChild(ventana);
    });

    document.getElementById('btn-copiar-dia').addEventListener('click', () => {
      const texto = `${versiculo.texto} (${versiculo.libro} ${versiculo.capitulo}:${versiculo.versiculo})`;
      navigator.clipboard.writeText(texto).then(() => {
      }).catch(err => {
        console.error('Error al copiar texto:', err);
        alert('No se pudo copiar el texto');
      });
    });

    document.getElementById('btn-cerrar-dia').addEventListener('click', () => {
      localStorage.setItem('lastVisitDate', hoy);
      document.body.removeChild(ventana);
    });
  }
}

function crearInputBusqueda() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Buscar libros...";
  input.classList.add("dropdown-search");
  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    const opciones = dropdownContent.querySelectorAll(".dropdown-option");
    opciones.forEach(opcion => {
      const visible = opcion.textContent.toLowerCase().includes(texto);
      opcion.style.display = visible ? "block" : "none";
    });
  });
  return input;
}

function agregarBotonVolver(destino) {
  const btn = document.createElement("button");
  btn.textContent = "Volver";
  btn.className = "dropdown-option";
  btn.style.fontWeight = "bold";
  btn.style.backgroundColor = "#ddd";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (destino === "libros") {
      cargarLibros();
    } else if (destino === "capitulos") {
      cargarCapitulos(libroActual);
    }
    dropdown.classList.add("open");
  });
  dropdownContent.insertBefore(btn, dropdownContent.firstChild);
}

function cargarLibros() {
  dropdownContent.innerHTML = '';
  estadoSelector = "libros";
  dropdownToggle.textContent = "Libro";
  const inputBusqueda = crearInputBusqueda();
  dropdownContent.appendChild(inputBusqueda);
  Object.keys(libros).forEach(nombre => {
    const opcion = document.createElement("div");
    opcion.className = "dropdown-option";
    opcion.textContent = nombre;
    opcion.addEventListener("click", async (e) => {
      e.stopPropagation();
      libroSeleccionado = nombre;
      dropdownToggle.textContent = nombre;
      await cargarCapitulos(nombre);
      dropdown.classList.add("open");
    });
    dropdownContent.appendChild(opcion);
  });
}

async function cargarCapitulos(nombreLibro) {
  const ruta = libros[nombreLibro];
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = nombreLibro;
  capituloSelectIndex = 0;
  estadoSelector = "capitulos";
  dropdownToggle.textContent = "Capítulo";
  dropdownContent.innerHTML = '';
  const grid = document.createElement("div");
  grid.className = "chapter-grid";
  capitulos.forEach((_, index) => {
    const btn = document.createElement("div");
    btn.className = "chapter-item";
    btn.textContent = index + 1;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      capituloSelectIndex = index;
      dropdownToggle.textContent = `Capítulo ${index + 1}`;
      mostrarCapitulo(index);
      cargarVersiculos(index);
      setTimeout(() => {
        dropdown.classList.add("open");
      }, 0);
    });
    grid.appendChild(btn);
  });
  dropdownContent.appendChild(grid);
  agregarBotonVolver("libros");
}

function cargarVersiculos(indexCapitulo) {
  estadoSelector = "versiculos";
  dropdownToggle.textContent = "Versículo";
  dropdownContent.innerHTML = '';
  const versiculos = capitulos[indexCapitulo];
  const grid = document.createElement("div");
  grid.className = "chapter-grid";
  versiculos.forEach((_, i) => {
    const btn = document.createElement("div");
    btn.className = "chapter-item";
    btn.textContent = i + 1;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      versiculoSelectIndex = i;
      dropdownToggle.textContent = `Versículo ${i + 1}`;
      mostrarVersiculo(indexCapitulo, i);
      dropdown.classList.remove("open");
    });
    grid.appendChild(btn);
  });
  dropdownContent.appendChild(grid);
  agregarBotonVolver("capitulos");
}

function cargarResaltados() {
  const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  favoritos.forEach(fav => {
    const versiculoId = `vers-${fav.versiculo}`;
    let elemento;
    if (esMovil) {
      elemento = document.querySelector(`[data-versiculo-id="${versiculoId}"]`);
    } else {
      elemento = document.querySelector(`[data-versiculo-id="${versiculoId}"]`);
    }
    if (elemento && fav.libro === libroActual && fav.capitulo === (capituloSelectIndex + 1)) {
      elemento.style.backgroundColor = fav.color || '#ffff99';
    }
  });
}

function mostrarCapitulo(index) {
  const versiculos = capitulos[index];
  capituloSelectIndex = index;
  versiculosDiv.innerHTML = `<h2>${libroActual} ${index + 1}</h2>`;
  versiculos.forEach((verso, i) => {
    if (esMovil) {
      const versiculoDiv = document.createElement('div');
      versiculoDiv.className = 'versiculo-item';
      versiculoDiv.setAttribute('data-versiculo-id', `vers-${i + 1}`);
      versiculoDiv.innerHTML = `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;
      let startY = 0;
      let moved = false;
      versiculoDiv.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        moved = false;
        pressTimer = setTimeout(() => {
          if (!moved) {
            mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
          }
        }, 500);
      });
      versiculoDiv.addEventListener('touchmove', (e) => {
        const currentY = e.touches[0].clientY;
        const diffY = Math.abs(currentY - startY);
        if (diffY > 10) {
          moved = true;
          clearTimeout(pressTimer);
        }
      });
      versiculoDiv.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
      });
      versiculosDiv.appendChild(versiculoDiv);
    } else {
      const versiculoDiv = document.createElement('div');
      versiculoDiv.className = 'versiculo-item';
      versiculoDiv.setAttribute('data-versiculo-id', `vers-${i + 1}`);
      versiculoDiv.innerHTML = `<p id="vers-${i + 1}"><strong>${i + 1}</strong> ${verso}</p>`;
      versiculoDiv.addEventListener('mousedown', (e) => {
        e.preventDefault();
        mouseMoved = false;
        pressTimer = setTimeout(() => {
          if (!mouseMoved) {
            mostrarVentanaDestacar(libroActual, index + 1, i + 1, verso, versiculoDiv);
          }
        }, 500);
      });
      versiculoDiv.addEventListener('mousemove', () => {
        mouseMoved = true;
        clearTimeout(pressTimer);
      });
      versiculoDiv.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
      });
      versiculoDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
      });
      versiculosDiv.appendChild(versiculoDiv);
    }
  });
  cargarResaltados();
}

async function generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 940;
  canvas.height = 788;
  const ctx = canvas.getContext('2d');

  const fondo = new Image();
  fondo.src = esVersiculoDelDia ? 'images/background-versiculo-dia.jpg' : 'images/background-versiculo.jpg';
  await new Promise(resolve => fondo.onload = resolve);
  ctx.drawImage(fondo, 0, 0, 940, 788);

  await document.fonts.load('32px "PT Serif"');

  const fontFamily = '"PT Serif", serif';
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `32px ${fontFamily}`;
  const referencia = `${libro} ${capitulo}:${versiculoNumero}`;
  const referenciaWidth = ctx.measureText(referencia).width;

  ctx.font = `28px ${fontFamily}`;
  const maxWidth = 800;
  const lineHeight = 40;
  const words = texto.split(' ');
  let line = '';
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const paddingX = 40;
  const paddingY = 20;
  const textWidth = Math.max(referenciaWidth, ...lines.map(l => ctx.measureText(l).width));
  const textHeight = (lines.length + 1) * lineHeight;
  const rectWidth = textWidth + paddingX * 2;
  const rectHeight = textHeight + paddingY * 2;
  const rectX = (940 - rectWidth) / 2;
  const rectY = (788 - rectHeight) / 2;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillRect(rectX, rectY, rectWidth, rectHeight);

  ctx.fillStyle = '#000000';
  ctx.font = `32px ${fontFamily}`;
  ctx.fillText(referencia, 470, rectY + paddingY + lineHeight / 2);

  ctx.font = `28px ${fontFamily}`;
  lines.forEach((line, i) => {
    ctx.fillText(line, 470, rectY + paddingY + lineHeight * (i + 1.5));
  });

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob));
  });
}

async function compartirVersiculoComoImagen(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia = false) {
  try {
    const blob = await generarImagenVersiculo(libro, capitulo, versiculoNumero, texto, esVersiculoDelDia);
    const file = new File([blob], `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${libro} ${capitulo}:${versiculoNumero}`,
        text: 'Comparte este versículo de Mi Biblia',
      });
      console.log('Versículo compartido como imagen con éxito');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `versiculo-${libro}-${capitulo}-${versiculoNumero}.png`;
      a.click();
      URL.revokeObjectURL(url);
      alert('La función de compartir no está soportada. La imagen se ha descargado.');
    }
  } catch (error) {
    console.error('Error al generar o compartir la imagen:', error);
    alert('Hubo un error al generar la imagen. Por favor, intenta de nuevo.');
  }
}

function mostrarVentanaDestacar(libro, capitulo, versiculo, texto, versiculoDiv) {
  const ventana = document.createElement('div');
  ventana.className = 'ventana-destacar';
  
  function aplicarEstilosVentana() {
    ventana.style.position = 'fixed';
    ventana.style.top = '50%';
    ventana.style.left = '50%';
    ventana.style.transform = 'translate(-50%, -50%)';
    ventana.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    ventana.style.width = '100%';
    ventana.style.height = '100%';
    ventana.style.display = 'flex';
    ventana.style.alignItems = 'center';
    ventana.style.justifyContent = 'center';
    ventana.style.zIndex = '1002';
  }

  function aplicarEstilosContenido(contenido) {
    contenido.style.backgroundColor = '#fff';
    contenido.style.padding = '1.5rem'; // Usar rem para consistencia
    contenido.style.borderRadius = '0.625rem';
    contenido.style.textAlign = 'center';
  }

  function aplicarEstilosBoton(boton, colorFondo) {
    boton.style.backgroundColor = colorFondo;
    boton.style.color = 'white';
    boton.style.border = 'none';
    boton.style.borderRadius = '0.5rem';
    boton.style.cursor = 'pointer';
    boton.style.margin = '0.3125rem'; // 5px en rem
  }

  function mostrarVistaInicial() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>¿Qué deseas hacer con este versículo?</p>
        <div class="botones-ventana">
          <button id="btn-destacar">Destacar</button>
          <button id="btn-compartir-imagen">Imagen</button>
          <button id="btn-copiar">Copiar</button>
          <button id="btn-cancelar">Cancelar</button>
        </div>
      </div>
    `;
    document.body.appendChild(ventana);

    aplicarEstilosVentana();
    const contenido = ventana.querySelector('.ventana-contenido');
    aplicarEstilosContenido(contenido);

    const btnDestacar = document.getElementById('btn-destacar');
    const btnCompartirImagen = document.getElementById('btn-compartir-imagen');
    const btnCopiar = document.getElementById('btn-copiar');
    const btnCancelar = document.getElementById('btn-cancelar');

    aplicarEstilosBoton(btnDestacar, '#4CAF50');
    aplicarEstilosBoton(btnCompartirImagen, '#01717d');
    aplicarEstilosBoton(btnCopiar, '#ff8000');
    aplicarEstilosBoton(btnCancelar, '#ff4444');

    btnDestacar.addEventListener('click', () => {
      mostrarVistaColores();
    });

    btnCompartirImagen.addEventListener('click', () => {
      compartirVersiculoComoImagen(libro, capitulo, versiculo, texto);
      document.body.removeChild(ventana);
    });

    btnCopiar.addEventListener('click', () => {
      const textoACopiar = `${texto} (${libro} ${capitulo}:${versiculo})`;
      navigator.clipboard.writeText(textoACopiar).then(() => {
        document.body.removeChild(ventana);
        // alert('Versículo copiado al portapapeles'); // Comentado para evitar notificación
      }).catch(err => console.error('Error al copiar:', err));
    });

    btnCancelar.addEventListener('click', () => {
      document.body.removeChild(ventana);
    });
  }

  function mostrarVistaColores() {
    ventana.innerHTML = `
      <div class="ventana-contenido">
        <p>Elige un color para destacar</p>
        <div class="color-options">
          <button class="color-btn" data-color="#ffff99" style="background-color: #ffff99;"></button>
          <button class="color-btn" data-color="#ffcccb" style="background-color: #ffcccb;"></button>
          <button class="color-btn" data-color="#add8e6" style="background-color: #add8e6;"></button>
          <button class="color-btn" data-color="#90ee90" style="background-color: #90ee90;"></button>
        </div>
        <div class="botones-ventana">
          <button id="btn-confirmar">Confirmar</button>
          <button id="btn-cancelar-colores">Cancelar</button>
        </div>
      </div>
    `;

    aplicarEstilosVentana();
    const contenido = ventana.querySelector('.ventana-contenido');
    aplicarEstilosContenido(contenido);

    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnCancelarColores = document.getElementById('btn-cancelar-colores');
    const colorButtons = ventana.querySelectorAll('.color-btn');

    aplicarEstilosBoton(btnConfirmar, '#4CAF50');
    aplicarEstilosBoton(btnCancelarColores, '#ff4444');

    let colorSeleccionado = '#ffff99';
    colorButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        colorSeleccionado = btn.getAttribute('data-color');
        colorButtons.forEach(b => b.style.border = 'none');
        btn.style.border = '2px solid #333';
      });
    });

    btnConfirmar.addEventListener('click', () => {
      destacarVersiculo(versiculoDiv, colorSeleccionado);
      guardarFavorito(libro, capitulo, versiculo, texto, colorSeleccionado);
      document.body.removeChild(ventana);
    });

    btnCancelarColores.addEventListener('click', () => {
      document.body.removeChild(ventana);
    });
  }

  mostrarVistaInicial();
}

function destacarVersiculo(versiculoDiv, color) {
  versiculoDiv.style.backgroundColor = color;
}

function guardarFavorito(libro, capitulo, versiculo, texto, color) {
  let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
  const existe = favoritos.some(fav => 
    fav.libro === libro && fav.capitulo === capitulo && fav.versiculo === versiculo
  );
  if (!existe) {
    favoritos.push({ libro, capitulo, versiculo, texto, color });
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
  } else {
    alert('Este versículo ya está en tus favoritos.');
  }
}

function mostrarVersiculo(capIndex, versIndex) {
  mostrarCapitulo(capIndex);
  const target = document.getElementById(`vers-${versIndex + 1}`);
  if (target) {
    target.style.backgroundColor = '#ffff99';
    if (esMovil) {
      target.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

dropdownToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("open");
  cargarLibros();
});

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
    estadoSelector = "libros";
    dropdownToggle.textContent = "Libro";
  }
});

btnAumentar.addEventListener("click", () => {
  fontSize += 2;
  versiculosDiv.style.fontSize = `${fontSize}px`;
});

btnAnterior.addEventListener("click", () => {
  if (capituloSelectIndex > 0) {
    capituloSelectIndex--;
    versiculoSelectIndex = 0;
    mostrarCapitulo(capituloSelectIndex);
    dropdownToggle.textContent = "Capítulo";
    cargarVersiculos(capituloSelectIndex);
  }
});

btnSiguiente.addEventListener("click", () => {
  if (capituloSelectIndex < capitulos.length - 1) {
    capituloSelectIndex++;
    versiculoSelectIndex = 0;
    mostrarCapitulo(capituloSelectIndex);
    dropdownToggle.textContent = "Capítulo";
    cargarVersiculos(capituloSelectIndex);
  }
});

(async function mostrarGenesis1() {
  const ruta = libros["Génesis"];
  const modulo = await import(`./${ruta}`);
  capitulos = modulo.default;
  libroActual = "Génesis";
  capituloSelectIndex = 0;
  versiculoSelectIndex = 0;
  mostrarCapitulo(0);
  dropdownToggle.textContent = "Libro";
})();

document.addEventListener('DOMContentLoaded', () => {
  mostrarVersiculoDelDia();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });
}