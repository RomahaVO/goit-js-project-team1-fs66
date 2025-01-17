
import { newsAPI } from './fetchNews';
import { load, save } from '../common/local_storage';
import api from '../common/API';
import paginator from './pagination.js';
import PaginationSearchHandler from  './paginationSearchHandler.js'

// !!!!!!!!!!!!!!!!!!!!!! код що ничже - це є для тесту, що сформувати різні дати прочитання, кожний раз коли буде перезагружатись сторінка home він буде перезаписувати localStorage кодом що нижче
const testLocalArray = [
  {
    watchDate: '2023-02-17T10:21:24.890Z',
    card: `<div class="news-card">
			<p class="news-card__status">Already read<p>
				<img src="https://static01.nyt.com/images/2023/02/16/multimedia/16sbf-bail-lbmc/16sbf-bail-lbmc-thumbStandard.jpg" class="news-card__img">
				<h2 class="news-card__title">Judge Signals Jail Time if Bankman-Fried’s Internet Access Is Not Curbed</h2>
				<p class="news-card__description">The defendant in a widespread cryptocurrency fraud case has been living in a “garden of electronic devices,” the judge says. Tighter restrictions are ahead.</p>
				<p class="news-card__date">2023-02-16</p>
				<a href="https://www.nytimes.com/2023/02/16/business/bankman-fried-crypto-fraud-bail.html" class="news-card__link">Read more</a>
			</div>`,
  },
  {
    watchDate: '2023-02-15T10:21:24.890Z',
    card: `<div class="news-card">
			<p class="news-card__status">Already read<p>
				<img src="https://static01.nyt.com/images/2023/02/16/business/ai-text-detection-promo/ai-text-detection-promo-thumbStandard.jpg" class="news-card__img">
				<h2 class="news-card__title">How ChatGPT Could Embed a ‘Watermark’ in the Text It Generates</h2>
				<p class="news-card__description">An arms race is underway to build more advanced artificial intelligence models like ChatGPT. So is one to build tools to determine whether something was written by A.I.</p>
				<p class="news-card__date">2023-02-17</p>
				<a href="https://www.nytimes.com/interactive/2023/02/17/business/ai-text-detection.html" class="news-card__link">Read more</a>
			</div>`,
  },
  {
    watchDate: '2023-02-15T10:21:24.890Z',
    card: `<div class="news-card">
			<p class="news-card__status">Already read<p>
				<img src="https://static01.nyt.com/images/2023/02/17/business/17stocks-promo/17stocks-promo-thumbStandard.png" class="news-card__img">
				<h2 class="news-card__title">Why a Strong Economy Is Making Stock Investors Jittery</h2>
				<p class="news-card__description">After stocks jumped more than 6 percent in January, the tone shifted markedly this week as a steady flow of data showed the economy continued to run hot.</p>
				<p class="news-card__date">2023-02-17</p>
				<a href="https://www.nytimes.com/2023/02/17/business/stock-market-economy.html" class="news-card__link">Read more</a>
			</div>`,
  },
  {
    watchDate: '2023-02-16T10:21:24.890Z',
    card: `<div class="news-card">
			<p class="news-card__status">Already read<p>
				<img src="https://static01.nyt.com/images/2023/02/18/business/17newworld-gpt-print1/00newworld-gpt-thumbStandard.jpg" class="news-card__img">
				<h2 class="news-card__title">Why China Didn’t Invent ChatGPT</h2>
				<p class="news-card__description">The state’s hardening censorship and heavier hand have held back its tech industry; so has entrepreneurs’ reluctance to invest for the long term. It wasn’t always that way.</p>
				<p class="news-card__date">2023-02-17</p>
				<a href="https://www.nytimes.com/2023/02/17/business/china-chatgpt-microsoft-openai.html" class="news-card__link">Read more</a>
			</div>`,
  },
];
// кінець тестового коду-----------------------------------------------------------------------------------------------------------------------------------

// особистий фетч для тесту, він не потрібний та на функціонал read page не впливає, окрім data об'єкту. В ньому зберігається у властивості cardsArray прочитані статті. 1 та 2 властивості для кастомного фетчу - не потрібні.

const newsFetch = new newsAPI();

// ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const data = {
  source: 'nyt',
  section: 'business',
  cardsArray: [],
};
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------

const refs = {
  homePageGallery: document.querySelector('.section__list-news'),
};

newsFetch.fetchNews(data).then(makeArrayOfNewsData).catch(console.log);

function makeArrayOfNewsData(response) {
  const arrayOfObject = response.results.map(el => {
    const {
      title,
      thumbnail_standard: imgUrl,
      created_date,
      abstract: description,
      url: readMore,
    } = el;
    const date = created_date.slice(0, 10);
    return { title, imgUrl, date, description, readMore };
  });
  const arrayOfCardTemplate = arrayOfObject.map(el => {
    const { title, imgUrl, date, description, readMore } = el;
    const template = `
			<div class="news-card">
				<p class="news-card__status"><p>
				<img src="${imgUrl}" class="news-card__img">
				<h2 class="news-card__title">${title}</h2>
				<p class="news-card__description">${description}</p>
				<p class="news-card__date">${date}</p>
				<a href="${readMore}" class="news-card__link">Read more</a>
			</div>
		`;

    return template;
  });

  refs.homePageGallery.insertAdjacentHTML(
    'beforeend',
    arrayOfCardTemplate.join(' ')
  );

  //  цейц код перезаписує local Storage після перезагрузки сторінки Home--------------------------------------------------------------------------------------------------
  save('cards', testLocalArray);
  // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
}

// кінець кастомного фетчу----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// запис коду у local storage. З коду вище потрібний тільки data об'єкт із cardsArray властивістю

refs.homePageGallery.addEventListener('click', handleClickGallery);

function handleClickGallery(e) {
  e.preventDefault();
  const targetElement = e.target;

  if (targetElement.nodeName === 'A') {
    const date = new Date(Date.now());
    const card = targetElement.closest('.news-card');
    const cardStatus = card.querySelector('.news-card__status');
    cardStatus.textContent = 'Already read';

    const stringifyCard = card.outerHTML;

    data.cardsArray.push({ watchDate: date, card: stringifyCard });
  }

  const uniqueNewsCardsArray = makeUniqueArrayByKey({
    key: 'card',
    array: data.cardsArray,
  });

  saveCardsToLocalStorage(uniqueNewsCardsArray);
}

function saveCardsToLocalStorage(array) {
  if (!load('cards')) {
    save('cards', array);
  } else {
    const cardsFromLocal = load('cards').concat(array);
    const uniqueConcatedArray = makeUniqueArrayByKey({
      key: 'card',
      array: cardsFromLocal,
    });

    save('cards', uniqueConcatedArray);
  }
}

function makeUniqueArrayByKey({ key, array }) {
  return [...new Map(array.map(item => [item[key], item])).values()];
}

// Кінець----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const KEY = 'lN1jAQVvVGOPSqcIQoMHMLLJA9oE1Rka';
const MOST_POPULAR_NEWS = `https://api.nytimes.com/svc/mostpopular/v2/viewed/1.json?api-key=${KEY}`;



async function getPopularArticle() {
    const articleFetch = await fetch(MOST_POPULAR_NEWS);
    const articles = await articleFetch.json();
    let { results } = articles;
    // console.log(results);

    const articlesCardsArr = results.map(({id, media, title, published_date, abstract, url, section})=>`<li class='articles-list-item' id='${id}'>
    <article class='articles-item-news'>

            <div class='articles-news-wrapper'>
                <img class='articles-img-news'  src='${media}' alt=''/>
                <p class="articles-news-category">${section}</p>
                <button type='button'>
                    <span> add favorite
                        <svg></svg>
                    </span>
                </button>
            </div>

            <div>
                <h2 class='articles-tittle-news'>${title}</h2>
                <p class='articles-text-news'>${abstract}</p>
            </div>

            <div>
                <span class='articles-date-news'>${published_date.split('')
                .splice(0, 10)
                .join('')
                .replaceAll('-', '/')}</span>
                <a target='blank' class='articles-link-news'  href='${url}'>Read more</a>
            </div>
    </article>
</li>`).join(' ');

updateNewArticles(articlesCardsArr);
};

getPopularArticle();

function updateNewArticles(articlesCardsArr) {
    // document.querySelector('.country-list').innerHTML = articlesCardsArr;
};


// ------------------------приклад використання Pagination-----------------

async function searchExample() {
  // Приклад onSearch

  // Взяти поточне значення с форми пошуку та дату з календаря.
  const apiParams = { q: 'Corgi', date: null };

  function onPageChanged(articles) {
    //Тут ми отримаємо статті для поточної сторінкі на пагінаторі,
    // в цьому місці можна їх рендерети
    console.log(articles);
  }

  // передати метод API та поточні параметри, Paginator буде викликати API при навігації на наступну сторінку
  const options = {
    perPage: 8,
    api: {
      method: api.articleSearchByQuery,
      params: apiParams,
      // Якщо ми працюємо з пошуком, то обовязково передати цей параметр.
      // Search дуже специфічне API, тому це потрібно, щоб не писати другий вид пагінатора
      externalHandler: new PaginationSearchHandler()
    },
    onPageChanged: onPageChanged,
  };

  // Виклик методу paginate з нашими параметрами
  paginator.paginate(options);
}

// searchExample()


async function categoryExample() {

  // Отримати поточну категорію та дату
  const apiParams = { category: 'arts', date: null };

  function onPageChanged(articles) {
    // Тут ми отримаємо статті для поточної сторінкі на пагінаторі,
    // в цьому місці можна їх рендерети
    console.log(articles);
  }

  // передати метод API та поточні параметри, Paginator буде викликати API при навігації на наступну сторінку
  const options = {
    perPage: 8,
    api: {
      method: api.articleSearchByCategory,
      params: apiParams,
    },
    onPageChanged: onPageChanged,
  };


  // Виклик методу paginate з нашими параметрами
  paginator.paginate(options);
}

//categoryExample();

async function mostPopularExample() {
  // Цей метод API дуже простий, він завжди повератє 20 записів.
  // Тому тут ми робимо pagination ніби-то це простий array
  // Попередньо отримавши усі можливі результати одним запросом

  const result = await api.articleSearchMostPopular();

  function onPageChanged(articles) {
    // Тут ми отримаємо статті для поточної сторінкі на пагінаторі,
    // в цьому місці можна їх рендерети
    console.log(articles);
  }

  // створити Paginator
  const options = { perPage: 8, items: result.articles, onPageChanged: onPageChanged }
  // Виклик методу paginate з нашими параметрами
  paginator.paginate(options);
}

mostPopularExample()