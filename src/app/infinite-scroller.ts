import { Datasource, IAdapter, IDatasource } from 'ngx-ui-scroll';

export class InfiniteScroller {
  pagedRequests = {
    '-1': new Promise((resolve) => {
      resolve([]);
    }),
  };

  constructor(
    private pageSize: number,
    private getPage: (page: number) => any[] | Promise<any>,
    private windowViewport: boolean,
    private bufferSize: number = 50,
    private padding: number = 0.5
  ) {}

  settings = {
    bufferSize: this.bufferSize,
    infinite: true,
    minIndex: 0,
    padding: this.padding,
    startIndex: 0,
    windowViewport: this.windowViewport,
  };

  getDatasource(): IDatasource<IAdapter<any>> {
    return new Datasource<IAdapter<any>>({
      get: (index, count, success) => {
        const startIdx = Math.max(index, 0);
        const endIdx = index + count - 1;
        if (startIdx > endIdx) {
          success([]);
          return;
        }

        const startPage = Math.floor(startIdx / this.pageSize);
        const endPage = Math.floor(endIdx / this.pageSize);

        const pageRequests: any[] = [];
        for (let i = startPage; i <= endPage; i++) {
          const existingRequest = this.pagedRequests[i];
          if (existingRequest) {
            pageRequests.push(existingRequest);
          } else {
            const newRequest = this.pagedRequests[i - 1].then((_) => {
              return this.getPage(i);
            });
            this.pagedRequests[i] = newRequest;
            pageRequests.push(newRequest);
          }
        }

        return Promise.all(pageRequests).then((pageResults) => {
          pageResults = pageResults.reduce(
            (acc, result) => [...acc, ...result],
            []
          );
          const start = startIdx - startPage * this.pageSize;
          const end = start + endIdx - startIdx + 1;
          return pageResults.slice(start, end);
        });
      },
      settings: this.settings,
    });
  }

  reset(): void {
    this.pagedRequests = {
      '-1': new Promise((resolve) => {
        resolve([]);
      }),
    };
  }
}
